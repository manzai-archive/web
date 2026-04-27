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

## Frontmatter 字段速查

```yaml
---
title: 中川家の寄席2024「保険の契約」
performers:
  - name: 中川家            # 显示名
    members: [中川剛, 中川礼二]
source:
  platform: youtube         # youtube | bilibili | local | other
  url: https://www.youtube.com/watch?v=xxx
  uploader: 中川家チャンネル
  uploaded_at: "2024-09-15"
  duration_sec: 193
language: ja                 # ISO 码
tags: [寄席, 2024]
speakers:                    # SPEAKER_00 → 真名映射
  SPEAKER_00: 礼二
  SPEAKER_01: 剛
sensitivity: normal          # normal | high
status: draft                # draft | reviewed
contributed_by: yourname
translations:                # 可选：每行翻译，必须与原文行数相等
  zh:
    - 大家好。
    - ...
---
```

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
