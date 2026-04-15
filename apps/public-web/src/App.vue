<template>
  <div class="page">
    <section class="hero">
      <div class="hero-main">
        <p class="eyebrow">FanSQ Reflection Wall</p>
        <h1>{{ summary.project_name || "教学反思墙" }}</h1>
        <p class="intro">
          {{ summary.subtitle || "记录真实感受，沉淀每一次课堂中的成长。" }}
        </p>
        <div class="hero-meta">
          <span>{{ summary.time_range }}</span>
          <span>{{ summary.organizer }}</span>
        </div>
      </div>
      <div class="hero-panel">
        <button class="primary-cta" type="button" @click="openSubmitModal">
          {{ isMobileView ? "快速提交反思" : "提交我的反思" }}
        </button>
        <p class="cta-hint">
          {{ isMobileView ? "提交后等待审核，通过后展示。" : "填写后会先进入审核，通过后才会展示在反思墙中。" }}
        </p>
      </div>
    </section>

    <section class="overview" :class="{ compact: isMobileView }">
      <article class="overview-card">
        <span>展示内容</span>
        <strong>{{ summary.visible_count }}</strong>
      </article>
      <article class="overview-card">
        <span>精选反思</span>
        <strong>{{ summary.featured_count }}</strong>
      </article>
      <article class="overview-card">
        <span>累计点赞</span>
        <strong>{{ summary.total_like_count }}</strong>
      </article>
    </section>

    <section class="toolbar" :class="{ mobile: isMobileView }">
      <div class="search-group">
        <input
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索标题、姓名、类型、项目或正文内容"
          @keyup.enter="applySearch"
        />
        <button type="button" @click="applySearch">搜索</button>
        <button type="button" class="ghost" @click="resetSearch">清空</button>
      </div>
      <div class="filter-group">
        <button :class="{ active: !featuredOnly }" type="button" @click="switchFeatured(false)">
          全部内容
        </button>
        <button :class="{ active: featuredOnly }" type="button" @click="switchFeatured(true)">
          只看精选
        </button>
        <button type="button" class="ghost" @click="fetchAll">刷新</button>
      </div>
    </section>

    <p v-if="submitFeedback" class="feedback">{{ submitFeedback }}</p>

    <section class="cards">
      <template v-if="reflections.length">
        <div
          v-for="(column, columnIndex) in reflectionColumns"
          :key="columnIndex"
          class="card-column"
        >
          <article
            v-for="item in column"
            :key="item.id"
            :ref="(element) => bindCardElement(item.id, element)"
            class="card"
            :class="{ featured: item.is_featured }"
            @click="openReader(item)"
          >
            <div class="card-top">
              <span v-if="item.is_featured" class="badge">精选</span>
              <span v-if="item.reflection_type_name" class="soft-badge">
                {{ item.reflection_type_name }}
              </span>
            </div>
            <h2>{{ item.reflection_title || "未命名反思" }}</h2>
            <p class="card-author">{{ item.display_name }}</p>
            <p>{{ item.submit_content }}</p>
            <footer>
              <div class="meta">
                <span>{{ formatTime(item.submit_time) }}</span>
                <span v-if="item.teaching_project_name">{{ item.teaching_project_name }}</span>
                <span v-if="summary.show_view_count">阅读 {{ item.view_count }}</span>
              </div>
              <button
                type="button"
                :disabled="item.liked || likingIds.has(item.id)"
                @click.stop="like(item.id)"
              >
                {{ item.liked ? "已点赞" : "点赞" }} {{ item.like_count }}
              </button>
            </footer>
          </article>
        </div>
      </template>

      <article v-else-if="!loading" class="empty-card">
        没有找到匹配的反思内容，换个关键词试试。
      </article>
    </section>

    <div v-if="reflections.length && hasMore" class="load-more">
      <button type="button" class="load-more-button" :disabled="loading" @click="loadMore">
        {{ loading ? "加载中..." : "加载更多" }}
      </button>
    </div>

    <transition name="reader-fade">
      <div
        v-if="readerVisible && activeReflection"
        class="reader-mask"
        :class="{ mobile: isMobileView }"
        @click.self="closeReader"
      >
        <transition name="reader-panel">
          <article
            v-if="readerVisible && activeReflection"
            class="reader-card"
            :class="{ 'mobile-reader-card': isMobileView }"
          >
            <div class="reader-header" :class="{ sticky: isMobileView }">
              <div>
                <p class="eyebrow">Reflection Reader</p>
                <h2>{{ activeReflection.reflection_title || "未命名反思" }}</h2>
                <p class="reader-author">{{ activeReflection.display_name }}</p>
              </div>
              <button type="button" class="icon-button" @click="closeReader">
                {{ isMobileView ? "返回列表" : "关闭" }}
              </button>
            </div>

            <div class="reader-meta">
              <span>{{ formatTime(activeReflection.submit_time) }}</span>
              <span v-if="activeReflection.reflection_type_name">
                {{ activeReflection.reflection_type_name }}
              </span>
              <span v-if="activeReflection.teaching_project_name">
                {{ activeReflection.teaching_project_name }}
              </span>
              <span v-if="summary.show_view_count">阅读 {{ activeReflection.view_count }}</span>
            </div>

            <div class="reader-content">
              <p>{{ activeReflection.submit_content }}</p>
            </div>

            <div class="reader-actions" :class="{ stacked: isMobileView }">
              <button
                type="button"
                :disabled="activeReflection.liked || likingIds.has(activeReflection.id)"
                @click.stop="like(activeReflection.id)"
              >
                {{ activeReflection.liked ? "已点赞" : "点赞" }} {{ activeReflection.like_count }}
              </button>
            </div>
          </article>
        </transition>
      </div>
    </transition>

    <transition name="modal-fade">
      <div
        v-if="submitVisible"
        class="modal-mask"
        :class="{ mobile: isMobileView }"
        @click.self="closeSubmitModal"
      >
        <section class="modal-card" :class="{ 'mobile-modal-card': isMobileView }">
          <div class="modal-header" :class="{ sticky: isMobileView }">
            <div>
              <p class="eyebrow">Quick Submit</p>
              <h2>{{ isMobileView ? "提交反思" : "提交你的课堂反思" }}</h2>
            </div>
            <button type="button" class="icon-button" @click="closeSubmitModal">关闭</button>
          </div>

          <form class="submit-form" @submit.prevent="submitReflection">
            <label>
              <span>反思标题</span>
              <input
                v-model="submitForm.reflection_title"
                type="text"
                maxlength="200"
                placeholder="给这条反思起一个清晰的标题"
              />
            </label>

            <label>
              <span>你的名字</span>
              <input
                v-model="submitForm.student_name"
                type="text"
                maxlength="100"
                placeholder="请输入你的姓名或昵称"
              />
            </label>

            <label>
              <span>反思类型</span>
              <select v-model="submitForm.reflection_type_id">
                <option value="">请选择反思类型</option>
                <option v-for="item in reflectionTypes" :key="item.id" :value="String(item.id)">
                  {{ item.name }}
                </option>
              </select>
            </label>

            <label v-if="selectedTypeRequiresProject">
              <span>支教项目</span>
              <select v-model="submitForm.teaching_project_id">
                <option value="">请选择支教项目</option>
                <option v-for="item in teachingProjects" :key="item.id" :value="String(item.id)">
                  {{ item.name }}
                </option>
              </select>
            </label>

            <label>
              <span>今天的感想 / 反思</span>
              <textarea
                v-model="submitForm.submit_content"
                rows="8"
                maxlength="5000"
                placeholder="写下你今天的收获、困惑或感受"
              />
            </label>

            <label class="checkbox-row">
              <input v-model="submitForm.is_anonymous" type="checkbox" />
              <span>前台匿名展示</span>
            </label>

            <div class="modal-actions" :class="{ stacked: isMobileView }">
              <button type="button" class="ghost" @click="closeSubmitModal">取消</button>
              <button type="submit" :disabled="submitLoading">
                {{ submitLoading ? "提交中..." : "确认提交" }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </transition>

    <div v-if="isMobileView" class="mobile-submit-bar">
      <button type="button" class="mobile-submit-button" @click="openSubmitModal">
        写下今天的反思
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import {
  apiClient,
  type PublicReflection,
  type PublicSummaryResponse,
  type ReflectionTypeOption,
  type TeachingProjectOption,
} from "./api";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1160;

const loading = ref(false);
const submitLoading = ref(false);
const submitVisible = ref(false);
const readerVisible = ref(false);
const featuredOnly = ref(false);
const searchKeyword = ref("");
const appliedKeyword = ref("");
const submitFeedback = ref("");
const reflections = ref<PublicReflection[]>([]);
const activeReflection = ref<PublicReflection | null>(null);
const reflectionTypes = ref<ReflectionTypeOption[]>([]);
const teachingProjects = ref<TeachingProjectOption[]>([]);
const likingIds = reactive(new Set<number>());
const viewportWidth = ref(typeof window === "undefined" ? 1280 : window.innerWidth);
const measuredCardHeights = reactive<Record<number, number>>({});
const cardElements = new Map<number, HTMLElement>();
const cardObservers = new Map<number, ResizeObserver>();

const pagination = reactive({
  page: 1,
  page_size: 9,
  total: 0,
});

const summary = reactive<PublicSummaryResponse>({
  project_name: "",
  subtitle: "",
  time_range: "",
  organizer: "",
  visible_count: 0,
  featured_count: 0,
  total_like_count: 0,
  total_view_count: 0,
  show_view_count: false,
});

const submitForm = reactive({
  reflection_title: "",
  student_name: "",
  reflection_type_id: "",
  teaching_project_id: "",
  submit_content: "",
  is_anonymous: false,
});

const hasMore = computed(() => reflections.value.length < pagination.total);
const isMobileView = computed(() => viewportWidth.value < MOBILE_BREAKPOINT);
const selectedReflectionType = computed(() =>
  reflectionTypes.value.find((item) => item.id === Number(submitForm.reflection_type_id)),
);
const selectedTypeRequiresProject = computed(
  () => selectedReflectionType.value?.requires_project ?? false,
);
const columnCount = computed(() => {
  if (viewportWidth.value < MOBILE_BREAKPOINT) return 1;
  if (viewportWidth.value < TABLET_BREAKPOINT) return 2;
  return 3;
});
const reflectionColumns = computed(() => {
  const count = columnCount.value;
  const columns = Array.from({ length: count }, () => [] as PublicReflection[]);
  const heights = Array.from({ length: count }, () => 0);

  for (const item of reflections.value) {
    let targetIndex = 0;
    for (let i = 1; i < count; i += 1) {
      if (heights[i] < heights[targetIndex]) {
        targetIndex = i;
      }
    }

    columns[targetIndex].push(item);
    heights[targetIndex] += getCardWeight(item);
  }

  return columns;
});

function getCardWeight(item: PublicReflection) {
  return measuredCardHeights[item.id] ?? estimateCardWeight(item) * 18;
}

function estimateCardWeight(item: PublicReflection) {
  const contentWeight = Math.ceil(item.submit_content.length / 48);
  const metaWeight =
    (item.reflection_title ? 1 : 0) +
    (item.reflection_type_name ? 1 : 0) +
    (item.teaching_project_name ? 1 : 0) +
    (summary.show_view_count ? 1 : 0) +
    (item.is_featured ? 1 : 0);

  return 8 + contentWeight + metaWeight;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function syncCardHeight(id: number, element: HTMLElement) {
  const nextHeight = Math.ceil(element.getBoundingClientRect().height);
  if (nextHeight > 0 && measuredCardHeights[id] !== nextHeight) {
    measuredCardHeights[id] = nextHeight;
  }
}

function unbindCardElement(id: number) {
  cardObservers.get(id)?.disconnect();
  cardObservers.delete(id);
  cardElements.delete(id);
}

function bindCardElement(id: number, element: Element | ComponentPublicInstance | null) {
  const htmlElement = element instanceof HTMLElement ? element : null;

  if (!htmlElement) {
    unbindCardElement(id);
    return;
  }

  const currentElement = cardElements.get(id);
  if (currentElement === htmlElement) {
    syncCardHeight(id, htmlElement);
    return;
  }

  unbindCardElement(id);
  cardElements.set(id, htmlElement);
  syncCardHeight(id, htmlElement);

  if (typeof ResizeObserver === "undefined") {
    return;
  }

  const observer = new ResizeObserver(() => {
    syncCardHeight(id, htmlElement);
  });
  observer.observe(htmlElement);
  cardObservers.set(id, observer);
}

async function refreshCardMeasurements() {
  await nextTick();
  for (const [id, element] of cardElements) {
    syncCardHeight(id, element);
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth;
}

function handleEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;

  if (readerVisible.value) {
    closeReader();
    return;
  }

  if (submitVisible.value) {
    closeSubmitModal();
  }
}

function resetSubmitForm() {
  submitForm.reflection_title = "";
  submitForm.student_name = "";
  submitForm.reflection_type_id = "";
  submitForm.teaching_project_id = "";
  submitForm.submit_content = "";
  submitForm.is_anonymous = false;
}

async function openSubmitModal() {
  submitFeedback.value = "";
  submitVisible.value = true;
  try {
    await fetchSubmitMeta();
  } catch (error) {
    console.error(error);
    submitFeedback.value = "提交选项加载失败，请刷新页面后重试。";
  }
}

function closeSubmitModal() {
  submitVisible.value = false;
}

async function openReader(item: PublicReflection) {
  activeReflection.value = item;
  readerVisible.value = true;
  await recordView(item.id);
}

function closeReader() {
  readerVisible.value = false;
}

async function fetchSummary() {
  const { data } = await apiClient.get("/public/summary");
  Object.assign(summary, data.data);
}

async function fetchSubmitMeta() {
  const { data } = await apiClient.get("/public/reflections/meta");
  reflectionTypes.value = data.data.reflection_types;
  teachingProjects.value = data.data.teaching_projects;
}

async function fetchReflections() {
  loading.value = true;
  try {
    const { data } = await apiClient.get("/public/reflections", {
      params: {
        page: pagination.page,
        page_size: pagination.page_size,
        featured_only: featuredOnly.value,
        keyword: appliedKeyword.value || undefined,
      },
    });

    reflections.value =
      pagination.page === 1 ? data.data.list : reflections.value.concat(data.data.list);
    Object.assign(pagination, data.data.pagination);
  } finally {
    loading.value = false;
    await refreshCardMeasurements();
  }
}

async function fetchAll() {
  pagination.page = 1;
  await Promise.all([fetchSummary(), fetchReflections(), fetchSubmitMeta()]);
}

async function recordView(id: number) {
  try {
    const { data } = await apiClient.post(`/public/reflections/${id}/view`);
    const target = reflections.value.find((item) => item.id === id);
    if (target) {
      target.view_count = data.data.view_count;
    }

    if (activeReflection.value?.id === id) {
      activeReflection.value.view_count = data.data.view_count;
    }

    if (data.data.counted) {
      summary.total_view_count += 1;
    }
  } catch (error) {
    console.error(error);
  }
}

async function like(id: number) {
  likingIds.add(id);
  try {
    const { data } = await apiClient.post(`/public/reflections/${id}/like`);
    const target = reflections.value.find((item) => item.id === id);
    if (target) {
      target.like_count = data.data.like_count;
      target.liked = true;
    }

    if (activeReflection.value?.id === id) {
      activeReflection.value.like_count = data.data.like_count;
      activeReflection.value.liked = true;
    }

    summary.total_like_count += 1;
  } catch (error) {
    console.error(error);
  } finally {
    likingIds.delete(id);
  }
}

async function switchFeatured(value: boolean) {
  featuredOnly.value = value;
  pagination.page = 1;
  await fetchReflections();
}

async function applySearch() {
  appliedKeyword.value = searchKeyword.value.trim();
  pagination.page = 1;
  await fetchReflections();
}

async function resetSearch() {
  searchKeyword.value = "";
  appliedKeyword.value = "";
  pagination.page = 1;
  await fetchReflections();
}

async function loadMore() {
  if (!hasMore.value || loading.value) return;
  pagination.page += 1;
  await fetchReflections();
}

async function submitReflection() {
  if (!submitForm.reflection_title.trim()) {
    submitFeedback.value = "请先填写反思标题。";
    return;
  }

  if (!submitForm.student_name.trim() || !submitForm.submit_content.trim()) {
    submitFeedback.value = "请先填写姓名和反思内容。";
    return;
  }

  if (!submitForm.reflection_type_id) {
    submitFeedback.value = "请选择反思类型。";
    return;
  }

  if (selectedTypeRequiresProject.value && !submitForm.teaching_project_id) {
    submitFeedback.value = "教学反思必须选择支教项目。";
    return;
  }

  submitLoading.value = true;
  try {
    await apiClient.post("/public/reflections/submit", {
      reflection_title: submitForm.reflection_title,
      student_name: submitForm.student_name,
      reflection_type_id: Number(submitForm.reflection_type_id),
      teaching_project_id: submitForm.teaching_project_id
        ? Number(submitForm.teaching_project_id)
        : undefined,
      submit_content: submitForm.submit_content,
      is_anonymous: submitForm.is_anonymous,
    });

    resetSubmitForm();
    submitVisible.value = false;
    submitFeedback.value = "提交成功，内容会在管理员审核通过后展示。";
  } catch (error) {
    console.error(error);
    submitFeedback.value = "提交失败，请稍后再试。";
  } finally {
    submitLoading.value = false;
  }
}

onMounted(async () => {
  document.addEventListener("keydown", handleEscape);
  window.addEventListener("resize", handleResize);
  await fetchAll();
});

watch(
  () => reflections.value.map((item) => item.id),
  async (ids) => {
    const idSet = new Set(ids);

    for (const existingId of Object.keys(measuredCardHeights).map(Number)) {
      if (!idSet.has(existingId)) {
        delete measuredCardHeights[existingId];
      }
    }

    for (const existingId of Array.from(cardElements.keys())) {
      if (!idSet.has(existingId)) {
        unbindCardElement(existingId);
      }
    }

    await refreshCardMeasurements();
  },
  { flush: "post" },
);

watch(columnCount, async () => {
  await refreshCardMeasurements();
});

watch(
  () => summary.show_view_count,
  async () => {
    await refreshCardMeasurements();
  },
);

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleEscape);
  window.removeEventListener("resize", handleResize);
  for (const id of Array.from(cardElements.keys())) {
    unbindCardElement(id);
  }
});
</script>
