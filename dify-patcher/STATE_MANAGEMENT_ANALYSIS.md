# Dify Workflow State Management System

완전한 분석: Flow 내 State 개념과 확장 가능성

## 📊 Executive Summary

Dify는 **계층화된 state 관리 시스템**을 제공합니다:

1. ✅ **VariablePool** - Workflow 실행 중 모든 변수 관리
2. ✅ **Conversation Variables** - 대화 세션 간 영구 상태
3. ✅ **Environment Variables** - 앱 레벨 전역 변수
4. ✅ **Variable Assigner/Aggregator** - 상태 수정/집계 노드
5. ✅ **Iteration/Loop State** - 반복문 내부 상태

**결론**: 단일 노드로 표현 불가능한 복잡한 로직을 위한 state 시스템이 **이미 존재**합니다!

---

## 🏗️ State 관리 아키텍처

### 1. VariablePool (Core Runtime State)

**위치**: `api/core/workflow/runtime/variable_pool.py`

**역할**: Workflow 실행 중 모든 변수를 중앙 집중식으로 관리

```python
class VariablePool(BaseModel):
    # 모든 노드의 출력 변수를 저장
    variable_dictionary: defaultdict[str, dict[str, VariableUnion]]

    # 특수 변수들
    system_variables: SystemVariable       # 시스템 변수
    environment_variables: Sequence[VariableUnion]  # 환경 변수
    conversation_variables: Sequence[VariableUnion] # 대화 변수
    user_inputs: Mapping[str, Any]         # 사용자 입력
```

**주요 기능**:

```python
# 변수 추가
pool.add(['node-id', 'variable_name'], value)

# 변수 조회 (selector 기반)
value = pool.get(['node-id', 'variable_name'])

# 중첩 값 접근
file_url = pool.get(['node-id', 'file', 'url'])
```

**Variable Selector 패턴**:
```
[node_id, variable_name]           # 기본
[node_id, variable_name, attr]     # 속성 접근 (File, Object)
```

---

### 2. Conversation Variables (영구 상태)

**위치**:
- `api/core/workflow/conversation_variable_updater.py`
- `api/core/workflow/nodes/variable_assigner/`

**역할**: **대화 세션 간 유지되는 영구 상태**

```python
# Conversation Variables는 대화 전체에서 유지됨
conversation_variables: [
    {"name": "user_preference", "value": "dark_mode"},
    {"name": "session_count", "value": 5},
    {"name": "last_query", "value": "날씨 알려줘"}
]
```

**특징**:
- ✅ DB에 영구 저장
- ✅ 대화 재시작 후에도 유지
- ✅ Variable Assigner로 수정 가능
- ✅ 모든 workflow에서 접근 가능

**사용 예시**:
```python
# Variable Assigner 노드에서
selector = [CONVERSATION_VARIABLE_NODE_ID, 'user_preference']
pool.add(selector, 'light_mode')  # 영구 저장
```

---

### 3. Environment Variables (앱 레벨 전역 변수)

**위치**: `api/core/workflow/runtime/variable_pool.py`

**역할**: **앱 전체에서 공유되는 전역 설정**

```python
# Environment Variables (앱 설정)
environment_variables: [
    {"name": "api_base_url", "value": "https://api.example.com"},
    {"name": "max_retries", "value": 3},
    {"name": "timeout_seconds", "value": 30}
]
```

**특징**:
- ✅ 모든 workflow에서 읽기 전용
- ✅ 관리자가 설정
- ✅ 런타임 중 변경 불가

---

### 4. Variable Assigner Node (상태 수정)

**위치**: `api/core/workflow/nodes/variable_assigner/v2/node.py`

**역할**: **변수 값을 수정하는 전용 노드**

#### 지원 연산

```python
class Operation(Enum):
    # 기본 연산
    OVER_WRITE  = "over-write"  # 덮어쓰기
    CLEAR       = "clear"        # 초기화
    SET         = "set"          # 값 설정

    # 배열 연산
    APPEND      = "append"       # 항목 추가
    EXTEND      = "extend"       # 배열 병합
    REMOVE_FIRST = "remove-first" # 첫 항목 제거
    REMOVE_LAST  = "remove-last"  # 마지막 항목 제거

    # 수학 연산
    ADD         = "add"          # 덧셈
    SUBTRACT    = "subtract"     # 뺄셈
    MULTIPLY    = "multiply"     # 곱셈
    DIVIDE      = "divide"       # 나눗셈
```

#### 사용 예시

**Conversation Variable 수정**:
```python
{
    "variable_selector": ["conversation", "user_count"],
    "operation": "add",
    "input_type": "constant",
    "value": 1  # user_count += 1
}
```

**Array 상태 관리**:
```python
{
    "variable_selector": ["conversation", "history"],
    "operation": "append",
    "input_type": "variable",
    "value": ["llm-node", "output"]  # history.append(llm_output)
}
```

**조건부 상태 업데이트**:
```
[IF-ELSE] → condition
    True → [Variable Assigner] → set status = "active"
    False → [Variable Assigner] → set status = "inactive"
```

---

### 5. Iteration Node (반복 상태)

**위치**: `api/core/workflow/nodes/iteration/iteration_node.py`

**역할**: **리스트를 순회하며 내부 상태 유지**

```python
# Iteration 내부에서
iteration_variables = {
    "index": 0,           # 현재 인덱스
    "item": current_item, # 현재 항목
    "output": []          # 누적 결과
}
```

**사용 패턴**:
```
[Start] → items = [1, 2, 3]
    ↓
[Iteration] → for item in items
    ↓
    [LLM] → process(item)
    ↓
    [Variable Assigner] → results.append(llm_output)
    ↓
[End] → return results
```

---

### 6. Loop Node (루프 상태)

**위치**: `api/core/workflow/nodes/loop/`

**역할**: **조건 기반 반복 실행**

```python
loop_state = {
    "iteration_count": 0,
    "continue": True,
    "accumulated_results": []
}
```

---

## 🎯 커스텀 노드에서 State 활용하기

### Pattern 1: Conversation Variable 읽기/쓰기

**Backend (Python)**:
```python
from core.workflow.constants import CONVERSATION_VARIABLE_NODE_ID

class MyCustomNode(BaseCustomNode):
    def _run(self) -> NodeRunResult:
        # Conversation Variable 읽기
        user_prefs = self.graph_runtime_state.variable_pool.get(
            [CONVERSATION_VARIABLE_NODE_ID, 'user_preferences']
        )

        # 로직 수행
        result = self.process_with_prefs(user_prefs)

        # 새로운 상태 저장 (Variable Assigner를 통해 자동 영구화)
        # Note: 직접 conversation variable 수정은 Variable Assigner 사용 권장

        return NodeRunResult(
            status=WorkflowNodeExecutionStatus.SUCCEEDED,
            outputs={'result': result}
        )
```

### Pattern 2: 다중 노드 간 상태 공유

**Workflow 구성**:
```
[Start]
    ↓
[Custom Node 1] → state_data 생성
    ↓
[Variable Assigner] → conversation.shared_state = state_data
    ↓
[Custom Node 2] → conversation.shared_state 읽기 및 활용
    ↓
[Variable Assigner] → conversation.shared_state 업데이트
    ↓
[Custom Node 3] → 최종 처리
```

### Pattern 3: Stateful Conversation

**시나리오**: 사용자와의 대화를 통해 점진적으로 정보 수집

```
Turn 1:
[User Input] → "피자 주문하고 싶어"
[LLM] → "어떤 종류의 피자를 원하세요?"
[Variable Assigner] → conversation.order_state = {"step": "pizza_type"}

Turn 2:
[User Input] → "페퍼로니"
[Custom Node] → conversation.order_state 읽기 (step: pizza_type)
[Variable Assigner] → conversation.order_state.pizza_type = "pepperoni"
                     → conversation.order_state.step = "size"
[LLM] → "어떤 사이즈를 원하세요?"

Turn 3:
[User Input] → "라지"
[Custom Node] → conversation.order_state 읽기
[Variable Assigner] → conversation.order_state.size = "large"
[Order API] → 주문 완료
```

### Pattern 4: Accumulator Pattern (누적 상태)

```python
# Custom Node에서 누적 상태 사용
class AccumulatorNode(BaseCustomNode):
    def _run(self) -> NodeRunResult:
        # 기존 누적값 읽기
        accumulated = self.graph_runtime_state.variable_pool.get(
            [CONVERSATION_VARIABLE_NODE_ID, 'accumulated_data']
        )

        if accumulated is None:
            accumulated = []

        # 새 데이터 추가
        new_data = self.process_input()

        return NodeRunResult(
            status=WorkflowNodeExecutionStatus.SUCCEEDED,
            outputs={
                'new_accumulated': accumulated + [new_data]
            }
        )
```

이후 Variable Assigner로:
```
conversation.accumulated_data = [accumulator_output]
```

---

## 💡 State 활용 고급 패턴

### 1. Multi-Step Decision Tree

**요구사항**: 복잡한 의사결정 과정을 단계별로 진행

```
[Start]
    ↓
[Variable Assigner] → conversation.decision_tree = {"level": 1, "choices": []}
    ↓
[LLM] → Level 1 질문
    ↓
[If-Else] → 사용자 응답 분석
    ↓ (choice A)
[Variable Assigner] → decision_tree.choices.append("A")
                     → decision_tree.level = 2
    ↓
[LLM] → Level 2 질문 (A 경로)
    ↓
... 반복 ...
```

### 2. Session Context Management

**요구사항**: 대화 세션 전체의 컨텍스트 추적

```python
# 초기화
conversation.session_context = {
    "intent": None,
    "entities": {},
    "turn_count": 0,
    "topic_history": []
}

# 각 턴마다 업데이트
turn_count += 1
topic_history.append(current_topic)
```

### 3. Feature Flags / User Preferences

**요구사항**: 사용자별 설정에 따라 동작 변경

```python
# Conversation Variable로 저장
conversation.feature_flags = {
    "use_advanced_mode": True,
    "language": "ko",
    "response_style": "detailed"
}

# Custom Node에서 활용
class AdaptiveNode(BaseCustomNode):
    def _run(self):
        flags = self.get_conv_var('feature_flags')

        if flags['use_advanced_mode']:
            return self.advanced_processing()
        else:
            return self.simple_processing()
```

### 4. Rate Limiting / Quota Management

**요구사항**: API 호출 횟수 제한

```python
# Conversation Variable
conversation.api_quota = {
    "daily_limit": 100,
    "used_today": 15,
    "last_reset": "2024-11-15"
}

# Custom Node에서 체크
class RateLimitedAPINode(BaseCustomNode):
    def _run(self):
        quota = self.get_conv_var('api_quota')

        if quota['used_today'] >= quota['daily_limit']:
            return NodeRunResult(
                status=WorkflowNodeExecutionStatus.FAILED,
                error="Daily quota exceeded"
            )

        # API 호출
        result = self.call_api()

        # Variable Assigner를 통해 카운트 증가
        return NodeRunResult(
            status=WorkflowNodeExecutionStatus.SUCCEEDED,
            outputs={
                'result': result,
                'new_quota_count': quota['used_today'] + 1
            }
        )
```

---

## 🛠️ Custom Node State Management Helper

dify-patcher에 추가할 수 있는 헬퍼:

```python
# sdk/python/dify_custom_nodes/state_helpers.py

from typing import Any, Optional
from core.workflow.constants import (
    CONVERSATION_VARIABLE_NODE_ID,
    ENVIRONMENT_VARIABLE_NODE_ID,
    SYSTEM_VARIABLE_NODE_ID
)

class StateManager:
    """Helper for managing state in custom nodes"""

    def __init__(self, variable_pool):
        self.pool = variable_pool

    def get_conversation_var(self, name: str) -> Optional[Any]:
        """Get conversation variable by name"""
        var = self.pool.get([CONVERSATION_VARIABLE_NODE_ID, name])
        return var.value if var else None

    def get_env_var(self, name: str) -> Optional[Any]:
        """Get environment variable by name"""
        var = self.pool.get([ENVIRONMENT_VARIABLE_NODE_ID, name])
        return var.value if var else None

    def get_system_var(self, name: str) -> Optional[Any]:
        """Get system variable by name"""
        var = self.pool.get([SYSTEM_VARIABLE_NODE_ID, name])
        return var.value if var else None

    def output_for_conv_var(self, name: str, value: Any) -> dict:
        """
        Generate output dict for Variable Assigner to update conversation variable

        Returns output dict that can be used with Variable Assigner node
        """
        return {f'conv_var_{name}': value}

# Usage in custom node:
class MyNode(BaseCustomNode):
    def _run(self):
        state = StateManager(self.graph_runtime_state.variable_pool)

        # Read conversation state
        user_prefs = state.get_conversation_var('preferences')

        # Process
        result = self.process(user_prefs)

        # Output for Variable Assigner
        return NodeRunResult(
            status=WorkflowNodeExecutionStatus.SUCCEEDED,
            outputs={
                'result': result,
                **state.output_for_conv_var('last_result', result)
            }
        )
```

---

## 📚 핵심 파일 레퍼런스

| 구성요소 | 파일 경로 | 설명 |
|---------|----------|------|
| **VariablePool** | `api/core/workflow/runtime/variable_pool.py` | 변수 저장소 |
| **GraphStateManager** | `api/core/workflow/graph_engine/graph_state_manager.py` | 그래프 실행 상태 |
| **Variable Assigner** | `api/core/workflow/nodes/variable_assigner/v2/node.py` | 변수 수정 노드 |
| **Conversation Updater** | `api/core/workflow/conversation_variable_updater.py` | 대화 변수 영구화 |
| **Iteration Node** | `api/core/workflow/nodes/iteration/iteration_node.py` | 반복 노드 |
| **Loop Node** | `api/core/workflow/nodes/loop/` | 루프 노드 |

---

## ✅ 결론

### Dify는 이미 강력한 State 관리 시스템을 제공합니다!

1. **✅ 단일 노드 한계 극복 가능**
   - Variable Assigner로 여러 노드 간 상태 공유
   - Conversation Variables로 영구 상태 유지

2. **✅ Flow 내 State 개념 존재**
   - VariablePool: Runtime state
   - Conversation Variables: Persistent state
   - Environment Variables: Global configuration

3. **✅ 복잡한 로직 구현 가능**
   - Multi-step workflows
   - Stateful conversations
   - Accumulator patterns
   - Decision trees

### 커스텀 노드 개발 시 권장사항

1. **읽기**: `variable_pool.get([node_id, var_name])`으로 변수 조회
2. **쓰기**: Variable Assigner 노드와 연계
3. **영구화**: Conversation Variables 활용
4. **전역 설정**: Environment Variables 사용

### Next Steps

1. ✅ ~~StateManager 헬퍼를 dify-patcher SDK에 추가~~ (완료: `sdk/python/dify_custom_nodes/state_helpers.py`)
2. ✅ ~~State 활용 예제 노드 작성 (stateful-chat-example)~~ (완료: `nodes/stateful-chat-example/`)
3. ✅ ~~문서에 State 패턴 가이드 추가~~ (완료: 이 문서 및 예제 README)

---

## 📦 실제 구현 예제

dify-patcher에 **stateful-chat-example** 노드가 추가되었습니다!

### 예제 노드 위치
```
dify-patcher/nodes/stateful-chat-example/
├── backend/node.py          # StateManager 사용 예제
├── frontend/panel.tsx       # 상태 관리 UI
├── manifest.json            # 노드 메타데이터
└── README.md                # 상세 사용법
```

### StateManager SDK 위치
```
dify-patcher/sdk/python/dify_custom_nodes/state_helpers.py
```

### 주요 기능

**StateManager 클래스**:
```python
from dify_custom_nodes import StateManager

state = StateManager(self.graph_runtime_state.variable_pool)

# 대화 변수 읽기
user_count = state.get_conversation_var('user_count')

# 환경 변수 읽기
api_url = state.get_env_var('api_base_url')

# 시스템 변수 읽기
conversation_id = state.get_system_var('conversation_id')

# Variable Assigner 출력 준비
output = state.output_for_conv_var('user_count', user_count + 1)
```

**StatePattern 헬퍼**:
```python
from dify_custom_nodes import StatePattern

# 카운터 증가
turn_count_output = StatePattern.counter_increment(state, 'turn_count')

# 피처 플래그 확인
if StatePattern.feature_flag_check(state, 'use_advanced_mode'):
    result = advanced_processing()

# 세션 컨텍스트 초기화
context = StatePattern.session_context_init()
```

### 예제 노드 실행 방법

1. **노드 설치**:
   ```bash
   cd dify-patcher
   cd installer/cli && npm start -- install --target ../../dify --mode dev
   ```

2. **워크플로우 구성**:
   - Stateful Chat Example 노드 추가
   - Variable Assigner 노드로 상태 저장 (turn_count, chat_history, etc.)
   - 여러 턴에 걸쳐 대화 진행

3. **상태 확인**:
   - 턴 카운트 자동 증가
   - 대화 히스토리 누적 (최대 10개)
   - 세션 컨텍스트 업데이트 (인텐트, 토픽 등)

상세한 사용법은 `nodes/stateful-chat-example/README.md` 참조!

---

**작성일**: 2024-11-15
**버전**: 2.0.0 (예제 구현 추가)
**상태**: Complete with Implementation
