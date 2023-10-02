function process(query) {
    // step 1: replace all punctuations with space
    var punctuations = /[,\.\/\?<>;:\'\"\\\|\[\]\{\}\(\)!@\#\$%\^\&\*~`\-_—=\+，。！？；：‘’“”【】《》〈〉、]/g
    query = query.replaceAll(punctuations, " ");
    // step 2: split with space
    query = query.split(" ");
    // step 3: split query
    for (var i = 0; i < query.length; i++) {
        query[i] = cut(query[i]);
    }
    // step 4: flatten the array
    query = query.flat();
    return query;
}

function multiply(str, times) {
    var res = "";
    for (var i = 0; i < times; i++) {
        res += str;
    }
    return res;
}

async function search(query, index_json) {
    var rev_index = index_json;
    var filekw = {};		// 记录每个文件里关键词的信息，indexed by filename & kw

    query.forEach(kw => {
        if (rev_index[kw]) {
            // 待搜索内容中有这个关键词
            rev_index[kw].forEach(doc => {
                var [filename, info] = doc;
                // 记录到 `filekw`
                filekw[filename] = filekw[filename] || {};
                filekw[filename][kw] = info;
            })
        }
    })

    // 处理连续的关键词
    var multi_keywords = {};    // indexed by 连续的关键词个数

    // for each files
    for (var fname in filekw) {
        var all_kws = [];   // [word, start pos, end pos, cnt] ......................... (where cnt is "合并的关键词个数, The number of keywords merged")
        let kws = filekw[fname];

        // init list
        for (let k in kws) {
            let [cnt, pos] = kws[k];
            pos.forEach(p => {
                all_kws.push([k, p, p + k.length, 1]);
            })
        }

        // process
        all_kws.sort((a, b) => a[1] - b[1]);    // sort by `start pos`, small first.
        for (var i = 0; i < all_kws.length - 1; i++) {
            var w1 = all_kws[i], w2 = all_kws[i + 1];
            if (w2[1] - w1[2] < settings.MULTIKW_MAX_SPACE) {
                // 挨在一起的两个关键词
                var merged = [
                    w1[0] + multiply(' ', w2[1] - w1[2] - 1) + w2[0],   // merged word
                    w1[1],                                              // use w1's start pos as merged-word's start pos
                    w2[2],                                              // use w2's end pos as merged-word's end pos
                    w1[3] + w2[3]                                       // `The number of keywords merged`
                ];

                all_kws.splice(i + 1, 1);   // remove w2
                all_kws[i] = merged;    // replace w1 with merged-word
                i--;    // go back 1 step
            }
        }

        // highlight keywords
        var highlights = [];    // each item = [start pos, end pos]
        all_kws.forEach(kw => {
            highlights.push([kw[1], kw[2]]);    // [start pos, end pos]
        })

        // sort list
        all_kws.sort((a, b) => b[3] - a[3]);    // sort by `The number of keywords merged`, big first.
        var most = all_kws[0];  // most matched item = [word, start pos, end pos, cnt]

        var left_bound = Math.max(most[1] - settings.CONTENT_AROUND, 0);    // left bound of content
        var right_bound = most[2] + settings.CONTENT_AROUND;   // right bound of content

        multi_keywords[most[3]] = multi_keywords[most[3]] || [];    // init `multi_keywords`
        multi_keywords[most[3]].push([fname, left_bound, right_bound, highlights]);  // format in `result-list format`
    }


    // ranking
    var result = [];  // each item = [filename, pos_start, pos_end, [[hl1_s, hl1_e], [hl2_s, hl2_e]]]
    var kwcnts = Object.keys(multi_keywords).reverse(); // big first

    kwcnts.forEach(kwcnt => {   // 连续的关键词个数
        multi_keywords[kwcnt].forEach(doc => {
            result.push(doc);
        })
    })

    result.flat();    // flatten

    // ===== compile to HTML =====
    // NOTE: THIS PLUGIN REQUIRES A `content` OBJECT, WHICH IS A MAP OF {filename: content}, STORES ALL CONTENTS OF ALL FILES.
    // 
    // var result_content = [];	// each item = [filename, HTML]
    // result.forEach(r => {
    //     let [fname, pos_start, pos_end, hl] = r;
    //     hl = hl.sort((a, b) => b[0] - a[0]);	// max first
    //     var c = content[fname].substring(pos_start, pos_end);
    //     // highlight
    //     hl.forEach(h => {
    //         // console.log(1, c);
    //         c = c.substring(0, h[0] - pos_start) + "<b>" + c.substring(h[0] - pos_start, h[1] - pos_start) + "</b>" + c.substring(h[1] - pos_start);
    //         // console.log(2, c);
    //     })
    //     result_content.push([fname, c]);
    // })

    return result;
}


// settings & vars

var query = "";
const settings = {
    MULTIKW_MAX_SPACE: 3,
    CONTENT_AROUND: 50,
}

// main
search();

