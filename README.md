# mini-search
a mini search enging which use reverse-index.

# useage
1. construct a `index.json` file, which is a reverse-index file.
```
{
    "keyword1": [
        [
            "file1", [count, [pos1, pos2, ...]]
        ],
        [
            "file2", [count, [pos1, pos2, ...]]
        ], 
        ...
    ],
    "keyword2": ...,
}
```

2. choose a programming language fits your code inside `search-scripts/`

3. provided some apis for our script:

| api | description | definition | example |
| --- | --- | --- | --- |
| `cut()` | cut a string into words | `cut(string) -> list` | `cut ("hello world") -> ["hello", "world"] ` |

4. customize your own search engine by changing a few lines of settings.
> in each script, there are a `settings` variable with full documention. you can change it to customize your own search engine.

| settings | description | type | example |
| --- | --- | --- | --- |
| `MULTIKW_MAX_SPACE` | engine will merge 2 keywords to 1 if their distance is less than `MULTIKW_MAX_SPACE` | `int` | `MULTIKW_MAX_SPACE: 3` |