# Warm Agent CS 观测工作台新手使用指南

## 这份文档给谁看

这份文档给刚开始接触 Grafana / Loki / Prometheus 的项目负责人、开发、
测试和运维使用。

你不需要先懂这些英文名。先记住一句话：

```text
观测系统就是项目的体检仪表盘。
```

它帮你回答：

```text
项目是不是活着？
哪个服务出问题？
最近有没有错误？
请求是不是突然变多？
数据库有没有告警？
出问题时该先看哪里？
```

## 先理解你看到的 3 个工作台

Grafana 里现在有 3 个 Warm Agent CS 工作台：

```text
Warm Agent CS 总览工作台
Warm Agent CS 服务请求与压力工作台
Warm Agent CS 日志工作台
```

这 3 个工作台是预置工作台，默认只读。日常只需要查看、筛选时间、
打开某个面板，不需要保存。

你可以把它们理解成 3 个层级。

### 1. 总览工作台

这是第一个要看的页面。

它的作用是：

```text
先判断项目整体有没有问题。
```

你不用一上来查日志，也不用猜哪个服务坏了。先打开总览工作台，
看几个大数字和趋势。

重点看：

```text
SaaS 健康
Gateway 健康
错误/异常
基础设施告警
观测组件异常
核心服务日志趋势
错误趋势
最新错误日志
最新基础设施告警
```

你可以这样理解：

```text
SaaS 健康        warm-saas 服务是否有健康检查日志
Gateway 健康     渠道网关是否有健康检查日志
错误/异常        项目最近有没有明显 error / exception
基础设施告警      Postgres / Redis 有没有 warning / timeout
观测组件异常      Grafana / Loki / Prometheus / Alloy 自己有没有异常
核心服务日志趋势   哪些服务最近在输出日志
错误趋势          错误是不是在持续变多
```

### 2. 服务请求与压力工作台

这是第二个要看的页面。

它的作用是：

```text
判断服务请求量和压力是否异常。
```

比如：

```text
请求是不是突然变多？
SaaS 有没有持续收到请求？
Gateway 有没有持续收到请求？
有没有 4xx / 5xx？
有没有慢请求？
有没有连接失败或超时？
```

重点看：

```text
SaaS 请求数
Gateway 请求数
业务 API 请求
异常状态
请求量趋势
健康检查趋势
SaaS 请求明细
Gateway 请求明细
异常状态 / 慢请求 / 超时
```

当前这个工作台是基于日志估算压力，不是精确性能指标。

它已经足够回答：

```text
有没有请求？
请求是不是突然多了？
有没有明显错误状态？
有没有慢请求关键词？
```

等后续 `Order Metrics-1` 做完，才会有更精确的：

```text
QPS
P95 / P99 延迟
错误率
DB 连接池
Redis Stream 积压
```

### 3. 日志工作台

这是第三个要看的页面。

它的作用是：

```text
当你已经发现问题后，进一步看具体日志。
```

比如总览工作台显示错误变多，你就进入日志工作台，看：

```text
错误/异常明细
warm-saas 请求日志
Gateway / 渠道接入日志
数据库 / Redis / 基础设施告警
全部项目日志
```

这个页面更适合排查具体问题。

## 为什么之前会提示保存

Grafana 原生 Dashboard 如果允许编辑，你只是打开某个 panel、切换视图、
调整时间范围，有时也会被它识别成“页面状态变化”，离开时弹出：

```text
Unsaved changes
Do you want to save your changes?
```

这对日常运维很烦，也不适合测试机多人查看。

所以 Warm Agent CS 预置工作台已经改成只读：

```text
只看，不保存
只排障，不误改
```

如果以后仍然看到这个弹窗，并且你只是查看日志，没有真的编辑面板，
请选择：

```text
Discard
```

不要点 `Save dashboard`。

## 为什么日志里有很多英文

Grafana/Loki 看到的是容器原始日志。原始日志里会包含两类内容。

### 第一类：业务日志

这是你真正关心的日志，例如：

```text
warm-saas 请求日志
gateway 渠道接入日志
Postgres / Redis 告警
业务接口状态码
request_id / trace_id
```

这些日志用于判断：

```text
业务有没有请求
接口有没有报错
渠道事件有没有进来
数据库有没有异常
```

### 第二类：观测系统自己的日志

这是 Grafana / Loki / Prometheus / Alloy 自己运行时输出的日志，例如：

```text
caller=engine.go
component=querier
query=
cache_result
plugin loaded
```

这些日志大多数是英文，而且多数不是业务问题。

为了让你更容易看懂，工作台里的“全部业务日志”已经排除了：

```text
warm-full-grafana
warm-full-loki
warm-full-prometheus
warm-full-alloy
```

也就是说：

```text
日常看业务问题，优先看全部业务日志。
需要排查观测系统本身，再看观测组件异常。
```

## 最推荐的使用顺序

日常不要一上来就看日志。日志太多，容易被信息淹没。

推荐顺序：

```text
第一步：总览工作台
第二步：服务请求与压力工作台
第三步：日志工作台
第四步：服务器命令确认
```

也就是：

```text
先看有没有问题
再看是不是压力问题
再看具体日志
最后用命令确认容器和数据库
```

## 每天怎么巡检

每天第一次打开系统时，可以按这个顺序看。

### 第一步：打开 Grafana

浏览器访问：

```text
http://<服务器IP>:3001
```

测试机示例：

```text
http://192.168.153.119:3001
```

进入：

```text
Dashboards -> Warm Agent CS
```

### 第二步：打开总览工作台

进入：

```text
Warm Agent CS 总览工作台
```

先看 6 个顶部数字：

```text
SaaS 健康
Gateway 健康
错误/异常
基础设施告警
观测组件异常
日志总量
```

简单判断：

```text
SaaS 健康 > 0：SaaS 有健康检查日志
Gateway 健康 > 0：Gateway 有健康检查日志
日志总量 > 0：Loki 正在收到日志
错误/异常 = 0：当前时间范围内没有明显错误
基础设施告警 = 0：当前时间范围内没有明显数据库/Redis 告警
```

### 第三步：看趋势

继续看：

```text
核心服务日志趋势
错误趋势
```

正常情况：

```text
核心服务日志趋势有线条
错误趋势没有突然尖峰
```

需要关注：

```text
某个核心服务日志突然为 0
错误趋势突然升高
日志量突然暴涨
```

### 第四步：打开请求与压力工作台

进入：

```text
Warm Agent CS 服务请求与压力工作台
```

重点看：

```text
SaaS 请求数
Gateway 请求数
业务 API 请求
异常状态
请求量趋势
健康检查趋势
```

正常情况：

```text
健康检查趋势持续有数据
异常状态没有持续增加
请求量趋势没有异常暴涨
```

### 第五步：必要时打开日志工作台

只有看到异常时，再打开：

```text
Warm Agent CS 日志工作台
```

优先看：

```text
错误/异常明细
数据库 / Redis / 基础设施告警
warm-saas 请求日志
Gateway / 渠道接入日志
```

## 看到 No data 怎么办

`No data` 不一定是坏事。

常见原因有 4 个。

### 情况 1：这个时间段确实没有日志

比如你选的是最近 15 分钟，但这 15 分钟没人访问业务接口，
某些请求面板就可能没有数据。

处理方式：

```text
把右上角时间范围从 Last 15 minutes 改成 Last 6 hours
```

### 情况 2：刚重启观测层，新标签还没进来

我们给日志增加了容器标签，例如：

```text
container=warm-full-saas
container=warm-full-gateway
```

这些标签只会出现在重启 Alloy 后的新日志里。

处理方式是在服务器执行：

```bash
curl -s http://localhost:8100/health
curl -s http://localhost:8200/health
```

等待 10 秒后刷新 Grafana。

### 情况 3：服务真的没有输出相关日志

比如 Gateway 没有收到 webhook 请求，那么 Gateway 业务请求面板可能没有数据。

这时可以先确认健康检查：

```bash
curl -i http://localhost:8200/health
```

如果 health 是 200，说明服务活着，只是当前没有相关业务请求。

### 情况 4：日志采集链路异常

如果所有工作台都没有日志，优先检查：

```bash
bash deploy/linux/observability.sh status
bash deploy/linux/observability.sh logs alloy
bash deploy/linux/observability.sh logs loki
```

再检查业务容器本身是否有日志：

```bash
docker logs --tail=50 warm-full-saas
docker logs --tail=50 warm-full-gateway
```

如果 Docker 本身有日志，但 Grafana 没有，说明问题在：

```text
Alloy -> Loki -> Grafana
```

## 看到红色或错误数字怎么办

不要先慌，按顺序判断。

### 第一类：错误/异常大于 0

先进入：

```text
Warm Agent CS 日志工作台 -> 错误/异常明细
```

看最新几条日志。

重点找：

```text
error
exception
traceback
failed
panic
fatal
```

如果只是偶发 1 条，而且业务页面正常，可以先记录。

如果持续增加，要继续看：

```text
是哪个 container？
是 warm-full-saas 还是 warm-full-gateway？
是否有 request_id？
是否和某个接口 path 有关？
```

### 第二类：基础设施告警大于 0

先进入：

```text
Warm Agent CS 总览工作台 -> 最新基础设施告警
```

常见关键词：

```text
postgres
redis
database
collation
warning
timeout
connection refused
```

当前测试机已知可能出现：

```text
Postgres collation version mismatch
```

这个不代表项目立即不可用，但生产前要安排数据库维护窗口处理。

### 第三类：异常状态大于 0

进入：

```text
Warm Agent CS 服务请求与压力工作台 -> 异常状态 / 慢请求 / 超时
```

重点看：

```text
status=4
status=5
HTTP 4xx
HTTP 5xx
timeout
connection refused
duration_ms 很大
```

判断方式：

```text
4xx：多数是请求参数、权限、登录、路由问题
5xx：多数是服务内部异常、数据库、依赖服务问题
timeout：多数是服务慢、依赖慢、网络或数据库连接问题
```

### 第四类：观测组件异常大于 0

这表示 Grafana / Loki / Prometheus / Alloy 自己有异常日志。

先看：

```bash
bash deploy/linux/observability.sh status
bash deploy/linux/observability.sh logs grafana
bash deploy/linux/observability.sh logs loki
bash deploy/linux/observability.sh logs alloy
```

如果下面命令返回 200，Grafana 基本健康：

```bash
curl -f http://127.0.0.1:3001/api/health
```

测试机不能访问外网，所以如果看到类似：

```text
grafana.com update check failed
plugin manifest keys timeout
```

这类不算业务故障。

## 出问题时的 5 分钟排查流程

如果你感觉项目“不对劲”，按下面顺序做。

### 第 1 分钟：看总览

打开：

```text
Warm Agent CS 总览工作台
```

看：

```text
SaaS 健康
Gateway 健康
错误/异常
基础设施告警
日志总量
```

### 第 2 分钟：看请求压力

打开：

```text
Warm Agent CS 服务请求与压力工作台
```

看：

```text
请求量趋势
异常状态
SaaS 请求明细
Gateway 请求明细
```

### 第 3 分钟：看具体日志

打开：

```text
Warm Agent CS 日志工作台
```

看：

```text
错误/异常明细
数据库 / Redis / 基础设施告警
全部项目日志
```

### 第 4 分钟：服务器命令确认

在服务器执行：

```bash
bash deploy/linux/status.sh
```

如果只看观测层：

```bash
bash deploy/linux/observability.sh status
bash deploy/linux/observability.sh check
```

### 第 5 分钟：按服务看日志

```bash
docker logs --tail=100 warm-full-saas
docker logs --tail=100 warm-full-gateway
docker logs --tail=100 warm-full-postgres
docker logs --tail=100 warm-full-redis
```

如果要持续跟随：

```bash
docker logs -f --tail=100 warm-full-saas
```

## 常见场景怎么判断

### 场景 1：业务页面打不开

先看：

```bash
bash deploy/linux/status.sh
curl -i http://localhost:3000
curl -i http://localhost:8100/health
```

Grafana 里看：

```text
总览工作台 -> SaaS 健康
总览工作台 -> 最新错误日志
请求压力工作台 -> 异常状态
```

如果 `warm-full-console` 不健康，优先查前端容器。

如果 `warm-full-saas` 不健康，优先查 SaaS 日志。

### 场景 2：接口变慢

Grafana 里看：

```text
服务请求与压力工作台 -> 请求量趋势
服务请求与压力工作台 -> 异常状态 / 慢请求 / 超时
日志工作台 -> warm-saas 请求日志
```

重点找：

```text
duration_ms
timeout
connection refused
database
redis
```

### 场景 3：渠道事件没有进来

Grafana 里看：

```text
日志工作台 -> Gateway / 渠道接入日志
服务请求与压力工作台 -> Gateway 请求明细
```

重点找：

```text
webhook
channel
douyin
xhs
oceanengine
lead
signature
binding
raw
```

如果 Gateway 没日志，说明可能平台没有推送到服务器，或网络入口没打通。

如果 Gateway 有日志但 SaaS 没有对应分析，继续查 warm-saas。

### 场景 4：数据库有警告

Grafana 里看：

```text
总览工作台 -> 最新基础设施告警
日志工作台 -> 数据库 / Redis / 基础设施告警
```

服务器确认：

```bash
docker exec -it warm-full-postgres psql -U tgo -d tgo -c "select version();"
```

当前测试机可能出现 collation warning。这个需要记录，但不要在业务高峰期随便修。

### 场景 5：Grafana 自己打不开

服务器执行：

```bash
bash deploy/linux/observability.sh status
curl -f http://127.0.0.1:3001/api/health
bash deploy/linux/observability.sh logs grafana
```

如果服务器本机 `curl` 是 200，但你电脑浏览器打不开，问题多半在：

```text
绑定地址
端口
局域网
代理
浏览器网络
```

测试机局域网访问需要：

```text
GRAFANA_BIND_ADDR=0.0.0.0
GRAFANA_ROOT_URL=http://192.168.153.119:3001
```

## 常用 LogQL 查询

一般情况下你不需要手写查询。真要查时，进入：

```text
Explore -> Loki -> Code
```

### 全部项目日志

```logql
{stack="warm-agent-cs"}
```

### 只看 SaaS

```logql
{stack="warm-agent-cs", container="warm-full-saas"}
```

### 只看 Gateway

```logql
{stack="warm-agent-cs", container="warm-full-gateway"}
```

### 查错误

```logql
{stack="warm-agent-cs"} |~ "(?i)(error|exception|traceback|failed|panic|fatal)"
```

### 查数据库/Redis 告警

```logql
{stack="warm-agent-cs", container=~"warm-full-postgres|warm-full-redis"} |~ "(?i)(warning|error|fail|timeout|connection refused|collation|database|redis|postgres)"
```

### 查 SaaS 请求

```logql
{stack="warm-agent-cs", container="warm-full-saas"} |~ "(request.start|request.end|/api/v1|/health)"
```

### 查 Gateway 请求

```logql
{stack="warm-agent-cs", container="warm-full-gateway"} |~ "(?i)(GET|POST|webhook|channel|douyin|xhs|oceanengine|lead|signature|binding|raw)"
```

### 查某个 request_id

把下面的 `xxx` 换成实际 request_id：

```logql
{stack="warm-agent-cs"} |= "xxx"
```

## 时间范围怎么选

右上角时间范围很重要。

推荐：

```text
刚发生的问题：Last 15 minutes
半小时内的问题：Last 30 minutes
今天排查：Last 6 hours
复盘当天：Last 24 hours
```

如果看不到数据，先把时间范围调大。

## 哪些现在还不是最终能力

当前工作台已经适合测试环境日常排障，但还不是完整生产可观测体系。

当前已经有：

```text
日志采集
中文工作台
服务健康判断
错误/异常判断
请求压力粗略判断
数据库/Redis 告警日志
```

后续还要补：

```text
业务 /metrics
QPS
P95 / P99 延迟
错误率
DB 连接池指标
Redis Stream 积压
Gateway 安全审计统计
trace_id 跨服务追踪
告警通知
```

这些属于后续建设：

```text
Order Metrics-1
Order Gateway-Security-1
Order Queue-1
```

## 一句话记忆

以后你可以这样用：

```text
先看总览判断有没有问题。
再看请求压力判断是不是访问量或接口问题。
最后看日志工作台找具体错误。
```
