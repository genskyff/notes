>   主要参考
>
>   -   [《离散数学（第五版）》](https://book.douban.com/subject/26319616/) (耿素云，屈婉玲，张立昂)

# 常用数学符号的 Latex 写法

1.  **量词**
    -   存在量词：`\exists`
    -   全称量词：`\forall`
2.  **集合和关系**
    -   属于：`\in`
    -   不属于：`\notin`
    -   子集：`\subset`
    -   真子集：`\subsetneq`
    -   超集：`\supset`
    -   空集：`\emptyset`
    -   并集：`\cup`
    -   交集：`\cap`
    -   差集：`\setminus`
    -   对称差集：`\oplus`

# 1 命题逻辑

## 1.1 命题符号化及联结词

能判断真假且真值唯一的陈述句为**命题**：

1.  是真命题：2 是素数
2.  非陈述句，不是命题：请关上门！
3.  是陈述句，但真假不确定，非命题：$x + y > 5$

不能拆成更简单的子句的命题为**简单命题**，如 (1)，由于真值确定，也称为**命题常项**。

(3) 不是命题，但当 x 和 y 确定时，真值也确定，称为**命题变项**，但不是**命题**。

数理逻辑中通常用 p、q、r、s 表示命题常项或变项，用 1、T 表示**真**，0、F 表示**假**。

由简单命题用**联结词**联结而成的命题称为**复合命题**：

1.  由联结词**非**构成：3 并非是偶数
2.  由联结词**且**构成：2 是素数且是偶数
3.  由联结词**或**构成：他学过英语或日语
4.  由联结词**若**...**则**构成：若 $x = y = 3$，则 $x + y > 5$
5.  由联结词**当且仅当**构成：$x + 1  = 4$ 当且仅当 $x = 3$

复合命题和联结词的符号定义：

>   **定义 1.1**
>
>   设 p 为任意命题，复合命题“非 p”称为 p 的**否定式**，记作 $\neg p$，其中 $\neg$ 为否定联结词，$\neg p$​ 为真当且仅当 p 为假。

>   **定义 1.2**
>
>   设 p、q 为两命题，复合命题“p 且 q”称作 p 与 q 的**合取式**，记作 $p \and q$，其中 $\and$ 为合取联结词，$p \and q$ 为真当且仅当 p 与 q 同时为真。
>
>   -   $p \and q$ 表示的逻辑关系是 p 与 q 同时成立。

>   **定义 1.3**
>
>   设 p、q 为两命题，复合命题“p 或 q”称作 p 与 q 的**析取式**，记作 $p \or q$，其中 $\or$ 为析取联结词，$p \or q$ 为真当且仅当 p 与 q 中至少一个为真。
>
>   -   $p \or q$ 表示的是一种相容性，即允许 p 与 q 同时为真。

>   **定义 1.4**
>
>   设 p、q 为两命题，复合命题“若 p，则 q”称作 p 与 q 的**蕴涵式**，记作 $p \rightarrow q$，称 p 为蕴涵式的**前件**，q 为蕴涵式的**后件**，$\rightarrow$ 称作蕴涵联结词，$p \rightarrow q$ 为假当且仅当 p 为真且 q 为假。
>
>   -   $p \rightarrow q$ 表示的逻辑关系是，q 是 p 的**必要条件**，或 p 是 q 的**充分条件**；
>   -   在自然语言中，p 与 q 往往有某种内在的联系，但在数理逻辑中 p 与 q 不一定有什么内在联系；
>   -   在数学中，往往表示前件 p 为真，后件 q 为真的推理关系，但在数理逻辑中，当前件 p 为假时，q 也为真。

>   **定义 1.5**
>
>   设 p、q 为两命题，复合命题“p 当且仅当 q”称作 p 与 q 的**等价式**，记作 $p \leftrightarrow q$，其中 $\leftrightarrow$ 为等价联结词，$p \leftrightarrow q$ 为真当且仅当 p、q 真值相同。
>
>   $p \leftrightarrow q$ 所表达的逻辑关系是，p 与 q 互为充分必要条件，只要 p 与 q 的真值同为真或假，那么 $p \leftrightarrow q$ 就为真，否则为假。

联结词符也称为**逻辑运算符**，具有运算**优先级**：

-   $\neg$ > $\and$ > $\or$ > $\rightarrow$ > $\leftrightarrow$​
-   相同优先级按从左到右顺序运算
-   $()$ 具有最高优先级

## 1.2 命题公式及分类

由多个简单命题和联结词可组成复杂的复合命题。若在复合命题中，p、q、r 等不仅可以代表命题常项，还可代表命题变项，这样组成的复合命题形式称为**命题公式**，即由**命题常项**、**命题变项**、**联结词**和**括号**等组成的**符号串**，但反过来则不一定是命题公式。

>   **定义 1.6**
>
>   1.   单个命题常项或变项 p，q，r，…，$p_i$，$q_i$，$r_i$，…及 0，1 是命题公式
>   2.   若 A 是命题公式，则 $(\neg A)$ 也是命题公式
>   3.   若 A、B 是命题公式，则 $(A \and B)$、$(A \or B)$、$(A \rightarrow B)$、$(A \leftrightarrow B)$ 也是命题公式
>   4.   只有**有限次地**应用（1）~（3）组成的符号串才是命题公式

规定 $(\neg A)$、$(A \and B)$ 等的外层括号可以省去，A、B 等符号代表任意的命题公式。

根据定义：

-   $\neg (p \or q)$、$p \rightarrow (q \rightarrow r)$、$(p \leftrightarrow q) \leftrightarrow r$ 都是命题公式

-   $pq \rightarrow r$、$\neg p \or \rightarrow q$ 都不是命题公式

>   **定义 1.7**
>
>   1.   若 A 是单个命题常项或变项，则称 A 是 0 层命题公式
>
>   2.   称 A 是 $n + 1\,(n \geq 0)$ 层公式是指 A 符合下列情况之一：
>        1.   $A = \neg B$，B 是 n 层公式
>        2.   $A = B \and C$，其中 B、C 分别为 i、j 层公式，且 $n = max(i, j)$
>        3.   $A = B \or C$，其中 B、C 层次同（2）
>        4.   $A = B \rightarrow C$，其中 B、C 层次同（2）
>        5.   $A = B \leftrightarrow C$，其中 B、C 层次同（2）

含有命题变项的命题公式的真值是不确定的，只有对其每个命题变项用指定的命题常项代替后，命题公式才变成命题，其真值也就唯一确定了。

>   **定义 1.8**
>
>   设 A 为命题公式，$p_1$，$p_2$，…，$p_n$ 为出现在 A 中的所有的命题变项，为其指定一组真值，称为对 A 的一个**赋值**。若指定的一组值使 A 的值为真，则称这组值为 A 的**成真赋值**，否则为**成假赋值**

含 n 个命题变项的命题公式共有 $2^n$​ 组赋值。将命题公式 A 在所有赋值之下取值的情况列成表，称为 A 的**真值表**。

|  p   |  q   |  r   | $\neg r$ | $q \or \neg r$ |
| :--: | :--: | :--: | :------: | :------------: |
|  0   |  0   |  0   |    1     |       1        |
|  0   |  0   |  1   |    0     |       0        |
|  0   |  1   |  0   |    1     |       1        |
|  0   |  1   |  1   |    0     |       1        |
|  1   |  0   |  0   |    1     |       1        |
|  1   |  0   |  1   |    0     |       0        |
|  1   |  1   |  0   |    1     |       1        |
|  1   |  1   |  1   |    0     |       1        |

根据在各种赋值下的取值情况，可将命题公式分为三类。

>   **定义 1.9**
>
>   设 A 为命题公式
>
>   1.   若 A 在所有赋值下取值均为真，则称 A 为**重言式**
>   2.   若 A 在所有赋值下取值均为假，则称 A 为**矛盾式**
>   3.   若 A 至少存在一组成真赋值，则称 A 是**可满足式**
>
>   由定义可知，重言式一定是可满足式，但反之则不然。
>
>   给定一个命题公式，判断其类型的一种方法是利用命题公式的真值表。若真值表最后一列全为 1，则这个命题公式为重言式；若全为 0，则为矛盾式；若既有 0 又有 1，则为非重言式的可满足式。

n 个命题变项的真值表实际上是给出 $\{0, 1\}^n$ 到 $\{0, 1\}$ 的一个对应关系。

>   **定义 1.10**
>
>   一个 $n\,(n \geq 1)$ 阶笛卡儿积 $\{0, 1\}^n$ 到 $\{0, 1\}$ 的函数称为一个 n 元**真值函数**，记为 F：
>   $$
>   F：\{0, 1\}^n \rightarrow \{0,1\}
>   $$

n 个命题变项，共有 $2^n$ 个可能的赋值，对于每个赋值，F 的值非 0 即 1，因此 n 个命题变项可以形成 $2^{2^n}$ 个不同的 F，每个 F 对应一个真值表，也对应无穷多个命题公式，这些公式彼此都是等值的，每个都是这个 F 的一个表达形式。

## 1.3 等值演算

给定 $n\,(n \geq 1)$ 个命题变项，按规则可以形成无穷多个命题公式，而在这无穷多个命题公式中，有些具有相同的真值表。

>   **定义 1.11**
>
>   设 A、B 为两命题公式，若等价式是重言式，则称 A 与 B 是**等值**的，记作 $A \Leftrightarrow B$。

根据定义，要判断命题公式之间是否等值，等价于判断真值表是否相同。

|  p   |  q   | $\neg (p \or q)$ | $\neg p \and \neg q$ | $\neg p \or \neg q$ |
| :--: | :--: | :--------------: | :------------------: | :-----------------: |
|  0   |  0   |        1         |          1           |          1          |
|  0   |  1   |        0         |          0           |          1          |
|  1   |  0   |        0         |          0           |          1          |
|  1   |  1   |        0         |          0           |          0          |

-   $\neg (p \or q)$ 和 $\neg p \and \neg q$ 等值
-   $\neg (p \or q)$ 和 $\neg p \or \neg q$ 不等值

### 常用等值式

| 名称           | 命题公式                                                     |
| -------------- | ------------------------------------------------------------ |
| 双重否定律     | $\neg\neg A \Leftrightarrow A$                               |
| 幂等律         | $A \or A \Leftrightarrow A$<br />$A \and A \Leftrightarrow A$ |
| 交换律         | $A \or B \Leftrightarrow B \or A$<br />$A \and B \Leftrightarrow B \and A$ |
| 结合律         | $(A \or B) \or C \Leftrightarrow A \or (B \or C)$<br />$(A \and B) \and C \Leftrightarrow A \and (B \and C)$ |
| 分配律         | $A \or (B \and C) \Leftrightarrow (A \or B) \and (A \or C)$<br />$A \and (B \or C) \Leftrightarrow (A \and B) \or (A \and C)$ |
| 吸收律         | $A \or (A \and B) \Leftrightarrow A$<br />$A \and (A \or B) \Leftrightarrow A$ |
| 德摩根律       | $\neg (A \or B) \Leftrightarrow \neg A \and \neg B$<br />$\neg (A \and B) \Leftrightarrow \neg A \or \neg B$ |
| 零律           | $A \or 1 \Leftrightarrow 1$<br />$A \and 0 \Leftrightarrow 0$ |
| 同一律         | $A \or 0 \Leftrightarrow A$<br />$A \and 1 \Leftrightarrow A$ |
| 排中律         | $A \or \neg A \Leftrightarrow 1$                             |
| 矛盾律         | $A \and \neg A \Leftrightarrow 0$                            |
| 蕴含等值式     | $A \rightarrow B \Leftrightarrow \neg A \or B$               |
| 假言易位       | $A \rightarrow B \Leftrightarrow \neg B \rightarrow \neg A$  |
| 等价等值式     | $A \leftrightarrow B \Leftrightarrow (A \rightarrow B) \and (B \rightarrow A)$ |
| 等价否定等值式 | $A \leftrightarrow B \Leftrightarrow \neg A \leftrightarrow \neg B$ |
| 归谬论         | $(A \rightarrow B) \and (A \rightarrow \neg B) \Leftrightarrow \neg A$ |

以上等值式都不难用真值表证明，由于 A、B、C 代表的是任意命题公式，因此每个公式都是一个模式，可以代表无数多个同类型的命题公式。根据已知的等值式，推演出与给定公式等值的公式的过程称为**等值演算**。在进行等值演算时，还要使用**置换规则**。

>   **定理 1.1**
>
>   设 $\Phi (A)$ 是含命题公式 A 的命题公式，$\Phi (B)$ 是用命题公式 B 置换了 $\Phi (A)$ 中的 A 之后得到的命题公式。若 $A \Leftrightarrow B$，则 $\Phi (A) \Leftrightarrow \Phi (B)$。
>
>   **证明**
>
>   由于 A 与 B 等值，对任意赋值，A 与 B 的值都相等，分别带入 $\Phi$，其结果显然相同。

## 1.4 范式

同一真值函数所对应的所有命题公式具有相同的标准型：主析取范式和主合取范式。

>   **定义 1.12**
>
>   仅由有限个命题变项或其否定构成的析取式称为**简单析取式**，仅由有限个命题变项或其否定构成的合取式称为**简单合取式**。

如 $p$、$\neg p$、$p \or q$、$p \or \neg q$ 都是简单析取式，$p$、$\neg p$、$p \and q$、$p \and \neg q$​ 都是简单合取式。

从定义可以看出：

-   一个简单析取式是重言式，当且仅当同时含有一个命题变项及其否定
-   一个简单合取式是矛盾式，当且仅当同时含有一个命题变项及其否定

>   **定义 1.13**
>
>   仅由有限个简单合取式构成的析取式称为**析取范式**，仅由有限个简单析取式构成的合取式称为**合取范式**。

如 $p \or q \or \neg r$、$(p \and q) \or (\neg p \and r)$ 是析取范式，$p \or q \or \neg r$、$(p \or q) \and (\neg p \or r)$ 是合取范式，其中 $p \or q \or \neg r$ 既可看作是含 3 个简单合取式的析取范式，也可看作是含 1 个简单析取式的合取范式。

析取范式与合取范式具有以下性质：

-   一个析取范式是矛盾式，当且仅当每个简单合取式都是矛盾式
-   一个合取范式是重言式，当且仅当每个简单析取式都是重言式

给定任意命题公式，都能通过等值演算求出与之等值的析取范式与合取范式：

1.   消去 $\rightarrow$ 和 $\leftrightarrow$
     $$
     p \rightarrow q \Leftrightarrow \neg p \or q \\
     p \leftrightarrow q \Leftrightarrow (\neg p \or q) \and (p \or \neg q)
     $$

2.   消去 $\neg$ 或内移
     $$
     \neg\neg p \Leftrightarrow p \\
     \neg (p \and q) \Leftrightarrow \neg p \or \neg q \\
     \neg (p \or q) \Leftrightarrow \neg p \and \neg q
     $$
     
3.   求析取范式应使用 $\and$ 对 $\or$ 求分配律，求合取范式应使用 $\or$ 对 $\and$ 求分配律

任意命题公式，经过以上三步演算，都可得到与它等值的析取范式或合取范式。

>   **定理 1.2** 
>
>   范式存在定理：任一命题公式都存在与之等值的析取范式和合取范式，但不唯一。

求 $((p \or q) \rightarrow r) \rightarrow p$ 的析取范式和合取范式。

1.   求析取范式
     $$
     (\neg (p \or q) \or r) \rightarrow p \\
     \Leftrightarrow \neg (\neg (p \or q) \or r) \or p \\
     \Leftrightarrow \neg ((\neg p \and \neg q) \or r) \or p \\
     \Leftrightarrow (\neg (\neg p \and \neg q) \and \neg r) \or p \\
     \Leftrightarrow ((p \or q) \and \neg r) \or p \\
     \Leftrightarrow (p \and \neg r) \or (q \and \neg r) \or p \\
     \Leftrightarrow p \or (q \and \neg r)
     $$

2.   求合取范式

     前 4 步相同，第 5 步应用不同的分配律。
     $$
     (\neg (p \or q) \or r) \rightarrow p \\
     \Leftrightarrow ((p \or q) \and \neg r) \or p \\
     \Leftrightarrow (p \or q \or p) \and (\neg r \or p) \\
          \Leftrightarrow (p \or q) \and (\neg r \or p)
     $$

由于析取范式与合取范式的不唯一性，因而析取范式与合取范式不能作为同一真值函数所对应的命题公式的标准形式。

>   **定义 1.14**
>
>   设有 n 个命题变项，若在简单合取式中每个命题变项与其否定有且仅有一个出现一次，则这样的简单合取式称为**极小项**。在极小项中，命题变项与其否定通常按下角标或字典顺序排列。

3 个命题变项 p、q、r 可形成 $2^3$​ 个极小项。若将命题变项看成 1，命题变项的否定看成 0，则每个极小项对应一个二进制数，这个二进制数正好是该极小项的成真赋值，其对应的十进制数作为该极小项符号的角码。

|            简单合取式            | 二进制 | 记作  |
| :------------------------------: | :----: | :---: |
| $\neg p \and \neg q \and \neg r$ |  000   | $m_0$ |
|   $\neg p \and \neg q \and r$    |  001   | $m_1$ |
|   $\neg p \and q \and \neg r$    |  010   | $m_2$ |
|      $\neg p \and q \and r$      |  011   | $m_3$ |
|   $p \and \neg q \and \neg r$    |  100   | $m_4$ |
|      $p \and \neg q \and r$      |  101   | $m_5$ |
|      $p \and q \and \neg r$      |  110   | $m_6$ |
|        $p \and q \and r$         |  111   | $m_7$ |

通常 n 个命题变项共产生 $2^n$ 个极小项，分别记为 $m_0, \, m_1, \, m_2, \, ..., \, m_{n - 1}$。

>   **定义 1.15**
>
>   若命题公式 A 的析取范式中的简单合取式全是极小项，则称该析取范式为 A 的**主析取范式**。

>   **定理 1.3**
>
>   任何命题公式都有唯一的主析取范式。

求命题公式 A 的主析取范式的步骤：

1.   求 A 的析取范式 A'

2.   若 A' 的某简单合取式 B 种不含命题变项 $p_i$，也不含 $\neg p_i$，则将 B 展开成：
     $$
     B \Leftrightarrow B \and 1 \Leftrightarrow B \and (p_i \or \neg p_i) \Leftrightarrow (B \and p_i) \or (B \and \neg p_i)
     $$
     若 B 种不含多个这样的 $p_i$，则同时合取所有这样的 $p_i$ 与 $\neg p_i$ 的析取

3. 消去重复出现的命题变项、极小项和矛盾式

4. 将极小项按角标升序排序

求 $((p \or q) \rightarrow r) \rightarrow p$ 的主析取范式：
$$
((p \or q) \rightarrow r) \rightarrow p \\
\Leftrightarrow p \or (q \and \neg r) \quad (析取范式) \\
\Leftrightarrow p \and (q \or \neg q) \and (r \or \neg r) \or (p \or \neg p) \and (q \and \neg r) \\
\Leftrightarrow (p \and \neg q \and \neg r) \or (p \and q \neg r) \or (p \and \neg q \and r) \\
\or (p \and q \and r) \or (\neg p \and q \and \neg r) \or (p \and q \and \neg r) \\
\Leftrightarrow m_4 \or m_6 \or m_5 \or m_7 \or m_2 \or m_6 \\
\Leftrightarrow m_2 \or m_4 \or m_5 \or m_6 \or m_7
$$
由极小项的定义可知，上式中，2、4、5、6、7 的二进制表示就为原公式的成真赋值，而此公式的主析取范式中没出现的极小项 $m_0$、$m_1$、$m_3$ 则为原公式的成假赋值。

因此只要知道了一个命题公式的主析取范式，可立即写出其真值表，反之亦然。

主析取范式有以下用途：

1.   判断两命题公式是否等值：由于任何命题公式的主析取范式都是唯一的，因此若 $A \leftrightarrow B$，说明 A 与 B 有相同的主析取范式，反之亦然。
2.   判断命题公式类型：设 A 是含 n 个命题变项的命题公式
     -   A 为重言式，当且仅当 A 的主析取范式中含全部 $2^n$ 个极小项
     -   A 为矛盾式，当且仅当 A 的主析取范式中不含任何极小项，此时记 A 的主析取范式为 0
     -   若 A 的主析取范式中至少含一个极小项，则 A 是可满足式

主析取范式的对偶形式为主合取范式。

>   **定义 1.16**
>
>   设有 n 个命题变项，若在简单析取式中每个命题变项与其否定有且仅有一个出现一次，则这样的简单析取式称为**极大项**。在极大项中，命题变项与其否定通常按下角标或字典顺序排列。

n 个命题变项可产生 $2^n$ 个极大项，分别记为 $M_0, \, M_1, \, M_2, \, ..., \, M_{n - 1}$。每个极大项对应一个二进制数，这个二进制数正好是该极大项的成假赋值，其对应的十进制数作为该极大项符号的角码。

>   **定义 1.17**
>
>   若命题公式 A 的合取范式中的简单析取式全是极大项，则称该合取范式为**主合取范式**。

>   **定理 1.4**
>
>   任一命题公式都有唯一的主合取范式。

求命题公式 A 的主合取范式与求主析取范式的步骤类似，也是先求出合取范式 A'，若 A' 的某简单析取式 B 中不含命题变项 $p_i$，也不含 $\neg p_i$，则将 B 展开成：
$$
B \Leftrightarrow B \or 0 \Leftrightarrow B \or (p_i \and \neg p_i) \Leftrightarrow (B \or p_i) \and (B \or \neg p_i)
$$
只要求出了命题公式 A 的主析取范式，就可以立即得到主合取范式，反之亦然。

极小项与极大项之间的关系为：
$$
\neg m_i \Leftrightarrow M_i, \quad \neg M_i \Leftrightarrow m_i
$$
设命题公式 A 中含 n 个命题变项，且设 A 的主析取范式中含 k 个极小项，则 $\neg A$ 的主析取范式中必含其余的 $2^{n - k}$​ 个极小项。

由此可得出由命题公式 A 的主析取范式求主合取范式的步骤：

1.   求出 A 的主析取范式
2.   A 的主析取范式中没出现的极小项的角码为极大项的角码
3.   由这些极大项构成的合取式即为 A 的主合取范式

如 A 含有三个命题变项，其主析取范式为：
$$
A \Leftrightarrow m_0 \or m_1 \or m_5 \or m_7
$$
则主合取范式为：
$$
A \Leftrightarrow M_2 \and M_3 \and M_4 \and M_6
$$

## 1.5 联结词全功能集

自然推理系统中，联结词集中的联结词可以多些，而公理系统中的就越少越好。但无论联结词集中的联结词有多少，都必须能够具备表示所有真值函数的能力，具有这样性质的联结词集叫**全功能集**。

>   **定理 1.5**
>
>   $\{\neg, \, \and, \, \or \}$、$\{\neg, \, \and \}$、$\{\neg, \, \or \}$、$\{\neg, \, \rightarrow \}$ 都是全功能集。
>
>   **证明**
>
>   由于每一个真值函数都可以用一个主析取范式表示，其中只使用了 $\neg, \, \and, \, \or$，故 $\{\neg, \, \and, \, \or \}$ 是全功能集。
>
>   为证 $\{\neg, \, \and \}$ 是全功能集，只需证 $\neg, \, \and$ 可以替代 $\or$：
>   $$
>   p \or q \Leftrightarrow \neg\neg(p \or q) \Leftrightarrow \neg (\neg p \and \neg q)
>   $$
>   故 $\{\neg, \, \and \}$ 是全功能集。
>
>   类似地，显然 $\{\neg, \, \or \}$ 也是全功能集。
>
>   又 $p \rightarrow q \Leftrightarrow \neg p \or q$，由于 $\{\neg, \, \or \}$ 是全功能集，故 $\{\neg, \, \rightarrow \}$ 也是全功能集。

除了这几种基本联结词外，还有两种常见联结词。

>   **定义 1.19**
>
>   设 p、q 为两命题，复合命题“p 与 q 的否定”称为 p 与 q 的**与非式**，记作 $p \uparrow q$，即 $p \uparrow q \Leftrightarrow \neg (p \and q)$，其中 $\uparrow$ 为**与非联结词**。
>
>   复合命题“ p 或 q 的否定”称作 p 与 q 的**或非式**，记作 $p \downarrow q$，即 $\neg (p \or q)$，其中 $\downarrow$ 为**或非联结词**。

根据定义，$p \uparrow q$ 为真当且仅当 p、q 不同时为真；$p \downarrow q$ 为真当且仅当 p、q 同时为假。

$\uparrow, \, \downarrow, \, \neg, \, \and, \, \or$ 之间具有如下关系：
$$
\neg p \Leftrightarrow \neg (p \and p) \Leftrightarrow p \uparrow p \\
p \and q \Leftrightarrow \neg\neg (p \and q) \Leftrightarrow \neg (p \uparrow q) \Leftrightarrow (p \uparrow q) \uparrow (p \uparrow q) \\
p \or q \Leftrightarrow \neg\neg (p \or q) \Leftrightarrow \neg (\neg p \and \neg q) \Leftrightarrow \neg p \uparrow \neg q \Leftrightarrow (p \uparrow p) \uparrow (q \uparrow q)
$$
类似地：
$$
\neg p \Leftrightarrow p \downarrow p \\
p \and q \Leftrightarrow (p \downarrow p) \downarrow (q \downarrow q) \\
p \or q \Leftrightarrow (p \downarrow q) \downarrow (p \downarrow q)
$$

>   **定理 1.6**
>
>   $\{ \uparrow \}, \, \{ \downarrow \}$ 是联结词全功能集。

显然，任何包含全功能集的联结词集都是全功能集，可以证明 $\{ \and, \, \or \}$ 不是全功能集，进而 $\{ \and \}, \, \{ \or \}$​ 不是全功能集。

将 $p \and \neg q$ 转化成只包含下列各联结词的等值公式。

1.   $\{ \neg, \, \or \}$
     $$
     p \and \neg q \\
     \Leftrightarrow \neg\neg (p \and \neg q) \\
     \Leftrightarrow \neg (\neg p \or q)
     $$

2.   $\{ \neg, \, \rightarrow \}$
     $$
     p \and \neg q \\
     \Leftrightarrow \neg (\neg p \or q) \\
     \Leftrightarrow \neg (p \rightarrow q)
     $$

3.   $\{ \uparrow \}$
     $$
     p \and \neg q \\
     \Leftrightarrow p \and (q \uparrow q) \\
     \Leftrightarrow \neg (\neg (p \and (q \uparrow q))) \\
     \Leftrightarrow \neg (p \uparrow (q \uparrow q)) \\
     \Leftrightarrow (p \uparrow (q \uparrow q)) \uparrow (p \uparrow (q \uparrow q))
     $$

4.   $\{ \downarrow \}$
     $$
     p \and \neg q \\
     \Leftrightarrow \neg (\neg p \or q) \\
     \Leftrightarrow \neg p \downarrow q \\
     \Leftrightarrow (p \downarrow p) \downarrow q
     $$

## 1.6 组合电路

可以用电子元件物理实现逻辑运算，用这些元件组合成的电路物理实现命题公式，称为**组合电路**。实现 $\and, \, \or, \, \neg$ 的元件分别叫**与门**、**或门**、**非门**。与门有两个或以上的输入，输出其合取；或门有两个或以上的输入，输出其析取；非门有一个输入，输出其否定。

![与门、或门、非门](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405192017828.png)

如命题公式 $(x \or y) \and \neg x$ 的电路图可以画成：

![命题公式的组合电路](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405192022107.png)

例：楼梯有一盏灯由上下 2 个开关控制，要求按动任何一个开关都能打开或关闭灯，试设计一个这样的线路。

设 x，y 分别表示两个开关，状态用 1 表示开、0 表示关。设都为 0 时灯是打开的，其真值表为：

|  x   |  y   | F(x, y) |
| :--: | :--: | :-----: |
|  0   |  0   |    1    |
|  0   |  1   |    0    |
|  1   |  0   |    0    |
|  1   |  1   |    1    |

根据真值表可以写出其主析取范式：
$$
F = m_0 \or m_3 = (\neg x \and \neg y) \or (x \and y)
$$
其组合电路为：

![F 的组合电路](https://raw.githubusercontent.com/genskyff/image-hosting/main/images/202405192046369.png)

考虑一个组合电路，当且仅当 $x = y = z = 1$ 或 $x = y = 1$ 且 $z = 0$ 时输出 1，那么其主析取范式为 $F = m_6 \or m_7 = (x \and y \and \neg z) \or (x \and y \and z)$。若按照主析取范式设计电路，则需要 4 个与门，1 个或门和 1 个非门，但该公式实际上等价于 $x \and y$​，只需要一个与门就够了。因此需要对主析取范式进行化简，使得尽可能包含最少的运算，称为**最简展开式**，通常会使用**奎因－麦克拉斯基算法**（Quine-McCluskey）。

除了上述常用门电路外，还有实现 $\uparrow$ 的**与非门**，实现 $\downarrow$ 的**或非门**。由于 $\{ \uparrow \}$ 和 $\{ \downarrow \}$​ 都是全功能集，因此可以只使用这两者实现电路。此外还有**异或门**、**同或门**等。

## 1.7 推理理论

