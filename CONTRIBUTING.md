# 贡献指南 / Contributing

欢迎贡献漫才剧本！本档案是开放协作的：维护者负责 review + merge，
任何人都能提交内容或修改既有条目。

## 三种贡献方式

### A. 一键提交（推荐给非技术用户）

最低门槛。不需要懂 git。

1. 打开 https://github.com/manzai-archive/web/issues/new/choose
2. 选 "提交剧本 / Submit a script"
3. 填表（URL、组合名、tags、敏感度），提交
4. 维护者审核后打 `accepted` 标签
5. 自动转写流水线跑（约 5-30 分钟，取决于视频长度）
6. 自动开 PR，PR 评论会回到你的 issue 通知你
7. 维护者修说话人映射、抽查准确度
8. 合并 → 网站更新 → issue 自动关闭

### B. 手写 markdown PR

适合自己已经有干净文本的人（例如你在某处找到了官方公开的剧本）。

1. Fork 这个仓库
2. 在 `src/content/manzai/` 下加一个 `.md` 文件，文件名格式：`<group-slug>-<year>-<title-slug>.md`
3. Frontmatter schema 看 [`src/content.config.ts`](src/content.config.ts) —
   或参考 `example-2024-sample.md`
4. 正文每行格式：`**SPEAKER_KEY** [HH:MM:SS] 内容`
5. 提 PR，标题 `[新增] <组合> <作品名>`

### C. 本地跑 pipeline 后 PR

适合开发者、能跑 Python 的人。

1. Clone https://github.com/manzai-archive/pipeline
2. `./scripts/setup.sh && source .venv/bin/activate`
3. 编辑 `.env`，填 `HF_TOKEN`
4. `python -m pipeline ingest <URL或本地视频路径> --group-slug <slug>`
5. 输出会写到本仓库的 `src/content/manzai/<slug>.md`（draft 状态）
6. 修说话人映射、校对，flip `status: draft` → `reviewed`
7. 提 PR

## 数据模型

剧本（`src/content/manzai/<slug>.md`）和组合（`src/content/performers/<slug>.yaml`）分开维护，剧本只引用组合的 slug，单一可信源。

### 组合 / Performer（一个文件一个组合）

`src/content/performers/nakagawake.yaml`：
```yaml
display_name: 中川家
display_name_alts: [Nakagawa-ke]
language: ja
region: jp
members:
  - name: 中川剛
    role: ツッコミ
  - name: 中川礼二
    role: ボケ
links:
  youtube_channel: https://...
description: |
  吉本兴业兄弟漫才组合。
```

新增组合就新建一个 yaml 文件，diff 干净，无合并冲突。

### 剧本 frontmatter

```yaml
---
title: 中川家の寄席2024「保険の契約」
performers: [nakagawake]      # 仅写 slug，必须在 performers 集合中存在
source:
  platform: youtube           # youtube | bilibili | local | other
  url: https://www.youtube.com/watch?v=xxx
  uploader: 中川家チャンネル
  uploaded_at: "2024-09-15"
  duration_sec: 193
  fetched_at: "2026-04-28T01:23:45Z"      # pipeline 自动写
  fetched_with: yt-dlp/2026.03.17         # pipeline 自动写
language: ja
tags: [寄席, 2024]
speakers:                                 # SPEAKER_00 → 真名映射
  SPEAKER_00: 礼二
  SPEAKER_01: 剛
sensitivity: normal                       # normal | high
status: draft                             # draft | reviewed
contributed_by: yourname
translations:                             # 可选：每行翻译，行数须与原文一致
  zh:
    - 大家好。
    - ...
ingestion:                                # pipeline 自动写，溯源用
  pipeline_version: "0.1.0"
  asr:
    backend: mlx
    model: mlx-community/whisper-large-v3-turbo
    detected_language: ja
    word_count: 387
  diarization:
    model: pyannote/speaker-diarization-3.1
    num_speakers: 2
    turn_count: 14
---
```

`ingestion` 块由 pipeline 自动写，让我们日后想"重跑所有 large-v3 之前的"一行 grep 就能筛。
不必手填，但若你手写 PR 可以省略整个块。

`fetched_at`/`fetched_with` 同理是溯源字段，pipeline 自动写，手写时可省。

### 审计/历史

不再单独维护 audit YAML——`git log src/content/manzai/<slug>.md` 就是完整历史，PR review 也是审计。

## Review 标准

维护者审核会看：

1. **是否合规**：URL 公开访问、不是私域来源
2. **说话人映射**：`SPEAKER_00` / `SPEAKER_01` 替换成真实演员名（左边/右边按视频里位置）
3. **抽查准确度**：随机听 5-10 行，转写错字率应低于 5%
4. **敏感度判断**：版权敏感（M-1 决赛、电视节目正式播出）的内容标 `sensitivity: high`，
   只渲染前 1/3 文本

## 报告问题

发现转写有误？开 [报告问题](https://github.com/manzai-archive/web/issues/new/choose)
issue。维护者会 re-transcribe 或手动修正。

## 行为准则

- 不接受版权敏感度极高、明显存在维权风险的内容（个别赛事的某些场次会拒绝）
- 不接受涉及他人隐私、未公开发布的录音
- 不接受 AI 编造的"剧本"——必须基于真实公开音视频

## 维护者

[wheatfox](https://github.com/enkerewpo) · 欢迎 issue / PR / 私信
