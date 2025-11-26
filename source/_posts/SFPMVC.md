---
title: SFPMVC
date: 2025-03-12 12:36:23
tags:
    - Research
categories:
    - Research
---

## 期刊信息

- 来源：Expert Systems With Applications 237 (2024) 121614

- 作者：Chaoyu Gong∗, Yang You

- 地址：School of Computing, National University of Singapore, 21 Lower Kent Ridge Rd, 119077, Singapore

<!-- more -->

## 阅读摘要

- **总体方向**是着重处理“自填充”这个点，而后面聚类中心的选择和SRMVEC异曲同工
- 聚类数的判定和可信划分的计算是分别进行的

- 聚类过程中的多视图对象的亲和矩阵的三个参数的优化过程
  - 在该优化算法中，\( \mathbf{X}_v^{(m)} \)、\( \mathbf{A} \) 和 \( \alpha_v \) 是核心变量，它们分别表示：  
  1. **\( \mathbf{X}_v^{(m)} \)（缺失数据的补全矩阵）**  
     - 这里的 \( \mathbf{X}_v \) 代表第 \( v \) 个视角（view）的数据矩阵，其中上标 \( (m) \) 代表该视角中 **缺失的数据部分（missing part）**。  
     - 在多视角学习任务中，不同视角的数据可能有缺失。例如，某个对象可能在某个视角的数据集中缺失，我们需要补全这些缺失部分，使其适应整体模型。  
     - **在优化过程中，我们的目标之一是求解最优的 \( \mathbf{X}_v^{(m)} \) 来填补这些缺失值，使数据更完整**。

  2. **\( \mathbf{A} \)（亲和矩阵，Affinity Matrix）**  
     - \( \mathbf{A} \) 是一个 **亲和矩阵**，用于描述样本之间的相似性。  
     - 该矩阵可以被看作是一个**图（Graph）**的邻接矩阵，每个元素 \( A_{ij} \) 表示第 \( i \) 个样本和第 \( j \) 个样本之间的关系权重。  
     - 在优化过程中，\( \mathbf{A} \) 影响数据的聚类结构，并用于数据补全和特征学习。  
     - **它的优化使得数据补全结果更符合整体数据结构**。

  3. **\( \alpha_v \)（视角权重，View Weight）**  
     - 在多视角学习中，不同的视角（数据来源）可能对最终任务（如聚类或分类）贡献不同。  
     - \( \alpha_v \) 代表第 \( v \) 个视角的重要性权重，确保对信息丰富的视角赋予更高的权重，而对噪声较大的视角赋予较低的权重。  
     - 这些权重满足约束 \( \sum_{v=1}^{p} \alpha_v = 1 \)，保证所有视角的贡献总和为 1。  
     - **优化 \( \alpha_v \) 的目的是找到最优的视角组合，使得最终的聚类/分类性能最佳**。
  - 整个优化过程就是不断调整这三个参数，使数据补全、视角权重分配和数据关系优化达到最优，从而提升最终的任务效果（如聚类或分类）。
- **整体算法**
    **Algorithm 1 SFPMEC algorithm**  

    | Step | Description |
    |------|------------|
    | **Input:**  | Partial data matrices \(\{X_1, X_2, \dots, X_p\}\), \(\rho\) and \(\eta\) |
    | **Output:** | Credal partition \(\mathcal{M}^{\Theta}\) |
    | 1  | Initialize \( A \), \( \alpha_v \), and \( X_v^{(m)} \) |
    | 2  | **repeat** |
    | 3  | Update \( X_v^{(m)} \) by solving the problem (17); |
    | 4  | Update the \( \alpha_v \) by solving the problem (23); |
    | 5  | Update \( A \) by solving \( n \) sub-problems (26); |
    | 6  | **until Convergence** |
    | 7  | Calculate \( Pos \) and \( Sep \) for each object according to Eq. (10) and Eq. (11), respectively; |
    | 8  | Map the multi-view objects to the \( Sep - Pos \) chart and detect \( c \) cluster centers; |
    | 9  | Initialize mass functions for \( c \) cluster centers (based on Eq. (30)) and other objects; |
    | 10 | **repeat** |
    | 11 | Update the step size \( \chi_e \) according to Eq. (32) or Eq. (34); |
    | 12 | Update parameter \( v_e \) according to Eq. (33) or Eq. (35); |
    | 13 | **until Convergence** |
