---
title: 备考csp，cpp相关内容整理
date: 2024-06-04 18:13:23
tags:
    - study
categories:
    -Study
---

## 1. `memset(dp,0x7f,sizeof(dp));`

## 2. `ios::sync_with_stdio(0);`

## 3. 背包问题（动态规划dp）

0-1背包是各个物品只有一个，而完全背包则是对于不同的物品，各个物品有无限个可以使用。

对应到代码来说，就是在更新不同“重量”的价值时，0-1背包时循环从大“重量”到小“重量”。而完全背包则是从小“重量”到大“重量”，这样可以在处理同一个重量价值的物品时，保留其多个叠加的影响。

## 4. int开数组问题

```cpp
int a[1000][1000]; // ≈4MB
int a[3000][3000]; // ≈36MB
int a[5000][5000]; // ≈100MB，已经较大了
```

## 5. 有关**输出流，输入流**方面要点

### 5.1 输入

- `cin`读取第一个数据，不读空格或换行
- `scanf`根据要求的格式读取
- 对于数据的键入，一般通过[ 回车enter ]确定，但会再缓冲区加入换行符`/n`，连续的`cin`输入当然不会收到影响，而对于读取细节要求较高的题目，应该注意缓冲区中残留的`/n`
- `getchar()`，c语言形式，适用于cpp，读取单个字符，可读空格，换行，一般用`getchar()`来清除残留的空格
- `getline(cin, a)`，其中`a`是`string`cpp中数据结构。`getline` 读取到换行符（`\n`）时会停止读取，但它不会把换行符包含进字符串里，而是会把换行符从输入流中丢弃。
- `stringstream ss(a);`它提供了一个字符串流对象，可以像操作输入输出流一样操作字符串。
  - 例子：

```cpp
string line = "100 200 300";
stringstream ss(line);

int a, b, c;
ss >> a >> b >> c;
```

可以用于对读取的一整行数据根据空格进行拆分，用于进一步处理。

### 5.2 输出

- `cout`不会自动换行，用`endl`
- `printf`不会自动换行

## 6. 优雅删除string第一个字符

```cpp
string s = "example";
string t = s.substr(1);  // 从索引1开始一直到末尾
```

```cpp
string s = "abcdef";

string a = s.substr(0, 3);   // "abc"
string b = s.substr(2, 2);   // "cd"
string c = s.substr(4);      // "ef"（从下标4到结尾）
string d = s.substr(0);      // "abcdef"（整个字符串）
```

## 7. map直接查询不存在的对象，会创建map的对应关系，并赋给默认值

## 8. 生成一串0字符串

- `string a = string(cnt, '0');`

## 9. 最大公因数

`__gcd(a, b)`

## 10. 大小写转换

`tolower()`
`toupper()`