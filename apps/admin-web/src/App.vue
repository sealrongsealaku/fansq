<template>
  <div class="shell">
    <section v-if="!isAuthenticated" class="auth-card">
      <div class="auth-copy">
        <p class="eyebrow">FanSQ Admin</p>
        <h1>教学反思墙管理后台</h1>
        <p>登录后可以审核反思、控制前台展示、导出内容，并维护反思类型与支教项目。</p>
      </div>

      <el-form class="auth-form" :model="loginForm" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入管理员用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-button type="primary" :loading="loginLoading" @click="handleLogin">登录</el-button>
      </el-form>
    </section>

    <template v-else>
      <header class="hero">
        <div>
          <p class="eyebrow">FanSQ Admin</p>
          <h1>反思审核工作台</h1>
          <p class="subtitle">先把审核和展示主链路跑顺，再按需打开基础数据弹窗做维护。</p>
        </div>
        <div class="hero-actions">
          <span class="welcome">当前用户：{{ currentUser?.username }}</span>
          <el-button plain @click="refreshAll">刷新</el-button>
          <el-button type="primary" plain :loading="exportLoading" @click="exportReflections">导出感想</el-button>
          <el-button @click="handleLogout">退出登录</el-button>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card"><span>总提交</span><strong>{{ stats.total_count }}</strong></article>
        <article class="stat-card"><span>待审核</span><strong>{{ stats.pending_count }}</strong></article>
        <article class="stat-card"><span>已通过</span><strong>{{ stats.approved_count }}</strong></article>
        <article class="stat-card"><span>已展示</span><strong>{{ stats.visible_count }}</strong></article>
        <article class="stat-card"><span>总阅读</span><strong>{{ stats.total_view_count }}</strong></article>
      </section>

      <section class="toolbar panel">
        <div class="toolbar-head">
          <div>
            <p class="eyebrow">Review Filters</p>
            <h2>内容筛选</h2>
          </div>
          <div class="toolbar-head-actions">
            <el-switch
              v-model="displaySettings.show_view_count"
              inline-prompt
              active-text="前台显示阅读量"
              inactive-text="隐藏阅读量"
              :loading="displaySettingsLoading"
              @change="saveDisplaySettings"
            />
            <el-button @click="openReflectionTypeDialog">管理反思类型</el-button>
            <el-button @click="openTeachingProjectDialog">管理支教项目</el-button>
          </div>
        </div>

        <div class="toolbar-grid">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="按姓名、类型、项目或正文搜索"
            @keyup.enter="fetchReflections"
          />
          <el-select v-model="filters.audit_status" clearable placeholder="审核状态">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
          <el-select v-model="filters.display_status" clearable placeholder="展示状态">
            <el-option label="隐藏" value="hidden" />
            <el-option label="展示中" value="visible" />
          </el-select>
          <el-select v-model="filters.reflection_type_id" clearable placeholder="反思类型">
            <el-option v-for="item in reflectionTypes" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select v-model="filters.teaching_project_id" clearable placeholder="支教项目">
            <el-option v-for="item in teachingProjects" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select v-model="filters.is_top" clearable placeholder="置顶状态">
            <el-option label="仅看置顶" :value="true" />
            <el-option label="仅看非置顶" :value="false" />
          </el-select>
          <div class="toolbar-actions">
            <el-button type="primary" @click="fetchReflections">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
        </div>
      </section>

      <section class="panel table-panel">
        <div v-if="isMobileView" v-loading="loading" class="mobile-review-list">
          <article v-for="row in reflections" :key="row.id" class="mobile-review-card">
            <div class="mobile-review-header">
              <div class="mobile-review-title-group">
                <strong class="submitter-name">{{ row.student_name }}</strong>
                <span class="subtle-text">{{ formatSubmitTime(row.submit_time) }}</span>
                <span class="subtle-text">{{ formatSubmitChannel(row.submit_channel) }}</span>
              </div>
              <div class="state-tags mobile-state-tags">
                <el-tag size="small" :type="getAuditTagType(row.audit_status)">{{ formatAuditStatus(row.audit_status) }}</el-tag>
                <el-tag size="small" effect="light" :type="getDisplayTagType(row.display_status)">{{ formatDisplayStatus(row.display_status) }}</el-tag>
              </div>
            </div>

            <div class="mobile-review-meta">
              <el-tag size="small" effect="plain">{{ row.reflection_type_name || "未分类" }}</el-tag>
              <span class="category-project">{{ row.teaching_project_name || "无需项目" }}</span>
              <el-tag v-if="row.is_top" size="small" type="danger" effect="plain">置顶</el-tag>
              <el-tag v-if="row.is_featured" size="small" type="success" effect="plain">精选</el-tag>
            </div>

            <div class="mobile-review-content">
              <strong class="content-title">{{ row.reflection_title || "未命名反思" }}</strong>
              <p>{{ row.submit_content || "点击详情查看正文" }}</p>
            </div>

            <div class="mobile-review-footer">
              <div class="mobile-review-metrics">
                <span class="subtle-text">点赞 {{ row.like_count }}</span>
                <span class="subtle-text">阅读 {{ row.view_count }}</span>
              </div>
              <div class="action-row mobile-action-row">
                <el-button size="small" @click="openDetail(row.id)">详情</el-button>
                <el-button v-if="row.audit_status === 'pending'" size="small" type="success" @click="approve(row.id)">通过</el-button>
                <el-button v-if="row.audit_status === 'pending'" size="small" type="warning" @click="reject(row.id)">驳回</el-button>
                <el-dropdown @command="handleMoreAction(row, $event)">
                  <el-button size="small" plain>更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="toggleVisibility">{{ row.display_status === "visible" ? "隐藏" : "展示" }}</el-dropdown-item>
                      <el-dropdown-item command="toggleTop">{{ row.is_top ? "取消置顶" : "设为置顶" }}</el-dropdown-item>
                      <el-dropdown-item command="toggleFeatured">{{ row.is_featured ? "取消精选" : "设为精选" }}</el-dropdown-item>
                      <el-dropdown-item command="remove" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </article>

          <div v-if="!loading && !reflections.length" class="mobile-empty-state">
            当前没有匹配的反思内容。
          </div>
        </div>

        <el-table v-else :data="reflections" v-loading="loading" stripe>
          <el-table-column label="提交信息" min-width="190">
            <template #default="{ row }">
              <div class="submitter-cell">
                <strong class="submitter-name">{{ row.student_name }}</strong>
                <span class="subtle-text">{{ formatSubmitTime(row.submit_time) }}</span>
                <span class="subtle-text">{{ formatSubmitChannel(row.submit_channel) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="分类信息" min-width="220">
            <template #default="{ row }">
              <div class="category-cell">
                <el-tag size="small" effect="plain">{{ row.reflection_type_name || "未分类" }}</el-tag>
                <span class="category-project">{{ row.teaching_project_name || "无需项目" }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="内容摘要" min-width="360">
            <template #default="{ row }">
              <div class="content-preview">
                <strong class="content-title">{{ row.reflection_title || "未命名反思" }}</strong>
                <span>{{ row.submit_content || "点击详情查看正文" }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" min-width="220">
            <template #default="{ row }">
              <div class="state-tags">
                <el-tag size="small" :type="getAuditTagType(row.audit_status)">{{ formatAuditStatus(row.audit_status) }}</el-tag>
                <el-tag size="small" effect="light" :type="getDisplayTagType(row.display_status)">{{ formatDisplayStatus(row.display_status) }}</el-tag>
                <el-tag v-if="row.is_top" size="small" type="danger" effect="plain">置顶</el-tag>
                <el-tag v-if="row.is_featured" size="small" type="success" effect="plain">精选</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="like_count" label="点赞数" width="90" />
          <el-table-column prop="view_count" label="阅读数" width="90" />

          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <div class="action-row">
                <el-button size="small" @click="openDetail(row.id)">详情</el-button>
                <el-button v-if="row.audit_status === 'pending'" size="small" type="success" @click="approve(row.id)">通过</el-button>
                <el-button v-if="row.audit_status === 'pending'" size="small" type="warning" @click="reject(row.id)">驳回</el-button>
                <el-dropdown @command="handleMoreAction(row, $event)">
                  <el-button size="small" plain>更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="toggleVisibility">{{ row.display_status === "visible" ? "隐藏" : "展示" }}</el-dropdown-item>
                      <el-dropdown-item command="toggleTop">{{ row.is_top ? "取消置顶" : "设为置顶" }}</el-dropdown-item>
                      <el-dropdown-item command="toggleFeatured">{{ row.is_featured ? "取消精选" : "设为精选" }}</el-dropdown-item>
                      <el-dropdown-item command="remove" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-bar">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :current-page="pagination.page"
            :page-size="pagination.page_size"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </section>

      <el-dialog v-model="reflectionTypeDialogVisible" title="管理反思类型" width="980px" destroy-on-close>
        <div class="meta-create-bar">
          <el-input v-model="typeCreateForm.name" placeholder="类型名称" />
          <el-input v-model="typeCreateForm.code" placeholder="唯一编码" />
          <el-input-number v-model="typeCreateForm.sort_order" :min="0" />
          <el-switch v-model="typeCreateForm.requires_project" active-text="需要项目" />
          <el-switch v-model="typeCreateForm.is_active" active-text="启用" />
          <el-button type="primary" @click="createReflectionType">新增类型</el-button>
        </div>

        <el-table :data="reflectionTypeDrafts" size="small">
          <el-table-column label="名称" min-width="160">
            <template #default="{ row }"><el-input v-model="row.name" /></template>
          </el-table-column>
          <el-table-column label="编码" min-width="160">
            <template #default="{ row }"><el-input v-model="row.code" /></template>
          </el-table-column>
          <el-table-column label="排序" width="120">
            <template #default="{ row }"><el-input-number v-model="row.sort_order" :min="0" /></template>
          </el-table-column>
          <el-table-column label="需要项目" width="120">
            <template #default="{ row }"><el-switch v-model="row.requires_project" /></template>
          </el-table-column>
          <el-table-column label="启用" width="100">
            <template #default="{ row }"><el-switch v-model="row.is_active" /></template>
          </el-table-column>
          <el-table-column label="操作" width="170">
            <template #default="{ row }">
              <div class="meta-row-actions">
                <el-button size="small" type="primary" @click="saveReflectionType(row)">保存</el-button>
                <el-button size="small" type="danger" plain @click="deleteReflectionType(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>

      <el-dialog v-model="teachingProjectDialogVisible" title="管理支教项目" width="960px" destroy-on-close>
        <div class="meta-create-bar project-create-bar">
          <el-input v-model="projectCreateForm.name" placeholder="项目名称" />
          <el-input v-model="projectCreateForm.code" placeholder="唯一编码，可为空" />
          <el-input-number v-model="projectCreateForm.sort_order" :min="0" />
          <el-switch v-model="projectCreateForm.is_active" active-text="启用" />
          <el-button type="primary" @click="createTeachingProject">新增项目</el-button>
        </div>

        <el-table :data="teachingProjectDrafts" size="small">
          <el-table-column label="名称" min-width="180">
            <template #default="{ row }"><el-input v-model="row.name" /></template>
          </el-table-column>
          <el-table-column label="编码" min-width="180">
            <template #default="{ row }"><el-input v-model="row.code" /></template>
          </el-table-column>
          <el-table-column label="排序" width="120">
            <template #default="{ row }"><el-input-number v-model="row.sort_order" :min="0" /></template>
          </el-table-column>
          <el-table-column label="启用" width="100">
            <template #default="{ row }"><el-switch v-model="row.is_active" /></template>
          </el-table-column>
          <el-table-column label="操作" width="170">
            <template #default="{ row }">
              <div class="meta-row-actions">
                <el-button size="small" type="primary" @click="saveTeachingProject(row)">保存</el-button>
                <el-button size="small" type="danger" plain @click="deleteTeachingProject(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>

      <el-drawer v-model="detailVisible" :size="isMobileView ? '100%' : '620px'" :with-header="false">
        <div v-if="detail" class="detail">
          <div class="detail-header">
            <div>
              <p class="eyebrow">Reflection Detail</p>
              <h2>{{ detail.student_name }}</h2>
            </div>
            <div class="detail-header-actions">
              <el-tag :type="getAuditTagType(detail.audit_status)">{{ formatAuditStatus(detail.audit_status) }}</el-tag>
              <el-button plain @click="closeDetail">{{ isMobileView ? "返回列表" : "关闭" }}</el-button>
            </div>
          </div>

          <el-form label-position="top">
            <el-form-item label="反思标题">
              <el-input v-model="detailForm.reflection_title" maxlength="200" placeholder="请输入反思标题" />
            </el-form-item>

            <el-form-item label="反思类型">
              <el-select v-model="detailForm.reflection_type_id" placeholder="请选择反思类型">
                <el-option v-for="item in reflectionTypes.filter((type) => type.is_active)" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>

            <el-form-item v-if="detailTypeRequiresProject" label="支教项目">
              <el-select v-model="detailForm.teaching_project_id" placeholder="请选择支教项目">
                <el-option v-for="item in teachingProjects.filter((project) => project.is_active)" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="正文">
              <el-input v-model="detailForm.submit_content" type="textarea" :rows="7" />
            </el-form-item>
            <el-form-item label="展示名">
              <el-input v-model="detailForm.display_name" placeholder="为空时按默认规则展示" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="detailForm.remarks" type="textarea" :rows="3" />
            </el-form-item>
            <div class="switches">
              <el-switch v-model="detailForm.is_featured" active-text="精选" />
              <el-switch v-model="detailForm.is_top" active-text="置顶" />
              <el-switch v-model="detailForm.is_anonymous" active-text="匿名展示" />
            </div>
            <el-button type="primary" :loading="saveLoading" @click="saveDetail">保存修改</el-button>
          </el-form>
        </div>
      </el-drawer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { apiClient, clearAdminToken, getAdminToken, saveAdminToken } from "./api";

const MOBILE_BREAKPOINT = 768;

interface CurrentUser {
  id: number;
  username: string;
  role: string;
}

interface ReflectionTypeItem {
  id: number;
  name: string;
  code: string;
  requires_project: boolean;
  is_active: boolean;
  sort_order: number;
}

interface TeachingProjectItem {
  id: number;
  name: string;
  code: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ReflectionItem {
  id: number;
  student_name: string;
  reflection_title: string | null;
  submit_content: string;
  submit_time: string;
  submit_channel: string;
  reflection_type_id: number | null;
  reflection_type_name: string | null;
  teaching_project_id: number | null;
  teaching_project_name: string | null;
  audit_status: "pending" | "approved" | "rejected";
  display_status: "hidden" | "visible";
  like_count: number;
  view_count: number;
  display_name: string | null;
  is_featured: boolean;
  is_top: boolean;
  is_anonymous: boolean;
  remarks: string | null;
}

type MoreAction = "toggleVisibility" | "toggleTop" | "toggleFeatured" | "remove";

const isAuthenticated = ref(Boolean(getAdminToken()));
const loginLoading = ref(false);
const loading = ref(false);
const saveLoading = ref(false);
const exportLoading = ref(false);
const displaySettingsLoading = ref(false);
const detailVisible = ref(false);
const reflectionTypeDialogVisible = ref(false);
const teachingProjectDialogVisible = ref(false);

const currentUser = ref<CurrentUser | null>(null);
const reflections = ref<ReflectionItem[]>([]);
const reflectionTypes = ref<ReflectionTypeItem[]>([]);
const teachingProjects = ref<TeachingProjectItem[]>([]);
const reflectionTypeDrafts = ref<ReflectionTypeItem[]>([]);
const teachingProjectDrafts = ref<TeachingProjectItem[]>([]);
const detail = ref<ReflectionItem | null>(null);
const viewportWidth = ref(typeof window === "undefined" ? 1280 : window.innerWidth);

const stats = reactive({
  total_count: 0,
  pending_count: 0,
  approved_count: 0,
  visible_count: 0,
  featured_count: 0,
  total_view_count: 0,
});

const displaySettings = reactive({
  show_view_count: false,
});

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0,
});

const loginForm = reactive({
  username: "admin",
  password: "",
});

const filters = reactive({
  keyword: "",
  audit_status: "",
  display_status: "",
  reflection_type_id: undefined as number | undefined,
  teaching_project_id: undefined as number | undefined,
  is_top: undefined as boolean | undefined,
});

const detailForm = reactive({
  reflection_title: "",
  reflection_type_id: undefined as number | undefined,
  teaching_project_id: undefined as number | undefined,
  submit_content: "",
  display_name: "",
  remarks: "",
  is_featured: false,
  is_top: false,
  is_anonymous: false,
});

const typeCreateForm = reactive({
  name: "",
  code: "",
  requires_project: false,
  is_active: true,
  sort_order: 0,
});

const projectCreateForm = reactive({
  name: "",
  code: "",
  is_active: true,
  sort_order: 0,
});

const detailSelectedType = computed(() =>
  reflectionTypes.value.find((item) => item.id === detailForm.reflection_type_id),
);

const detailTypeRequiresProject = computed(
  () => detailSelectedType.value?.requires_project ?? false,
);
const isMobileView = computed(() => viewportWidth.value < MOBILE_BREAKPOINT);

function cloneReflectionTypes(items: ReflectionTypeItem[]) {
  return items.map((item) => ({ ...item }));
}

function cloneTeachingProjects(items: TeachingProjectItem[]) {
  return items.map((item) => ({ ...item }));
}

function syncMetaDrafts() {
  reflectionTypeDrafts.value = cloneReflectionTypes(reflectionTypes.value);
  teachingProjectDrafts.value = cloneTeachingProjects(teachingProjects.value);
}

function extractApiMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  return typeof message === "string" ? message : "";
}

function isRequestCanceled(error: unknown) {
  return (
    (error as { message?: string })?.message === "cancel" ||
    (error as { message?: string })?.message === "close" ||
    error === "cancel" ||
    error === "close" ||
    (error as { code?: string })?.code === "ERR_CANCELED"
  );
}

function buildActionErrorMessage(
  error: unknown,
  fallback: string,
  overrides: Record<string, string> = {},
) {
  const apiMessage = extractApiMessage(error);
  if (apiMessage && overrides[apiMessage]) {
    return overrides[apiMessage];
  }

  const responseStatus = (error as { response?: { status?: number } })?.response?.status;
  if (responseStatus && responseStatus >= 500) {
    return "服务暂时无响应，请刷新后重试";
  }

  const errorCode = (error as { code?: string })?.code;
  if (errorCode === "ECONNABORTED") {
    return "请求超时，请稍后重试";
  }

  return apiMessage || fallback;
}

function getExportFilename(header?: string | null) {
  if (!header) return "fansq-reflections.csv";
  const matched = header.match(/filename=\"?([^\"]+)\"?/i);
  return matched?.[1] || "fansq-reflections.csv";
}

function formatSubmitTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function handleResize() {
  viewportWidth.value = window.innerWidth;
}

function formatSubmitChannel(value: string) {
  if (value === "website_form") return "网页表单";
  if (value === "qq_group_bot") return "QQ 机器人";
  return value;
}

function formatAuditStatus(value: ReflectionItem["audit_status"]) {
  if (value === "approved") return "已通过";
  if (value === "rejected") return "已驳回";
  return "待审核";
}

function getAuditTagType(value: ReflectionItem["audit_status"]) {
  if (value === "approved") return "success";
  if (value === "rejected") return "danger";
  return "warning";
}

function formatDisplayStatus(value: ReflectionItem["display_status"]) {
  return value === "visible" ? "展示中" : "已隐藏";
}

function getDisplayTagType(value: ReflectionItem["display_status"]) {
  return value === "visible" ? "primary" : "info";
}

function resetTypeCreateForm() {
  typeCreateForm.name = "";
  typeCreateForm.code = "";
  typeCreateForm.requires_project = false;
  typeCreateForm.is_active = true;
  typeCreateForm.sort_order = 0;
}

function resetProjectCreateForm() {
  projectCreateForm.name = "";
  projectCreateForm.code = "";
  projectCreateForm.is_active = true;
  projectCreateForm.sort_order = 0;
}

function closeDetail() {
  detailVisible.value = false;
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning("请输入用户名和密码");
    return;
  }

  loginLoading.value = true;
  try {
    const { data } = await apiClient.post("/admin/login", loginForm);
    saveAdminToken(data.data.access_token);
    isAuthenticated.value = true;
    await refreshAll();
    ElMessage.success("登录成功");
  } catch (error) {
    console.error(error);
    ElMessage.error("登录失败，请检查账号或密码");
  } finally {
    loginLoading.value = false;
  }
}

async function fetchCurrentUser() {
  const { data } = await apiClient.get("/admin/me");
  currentUser.value = data.data;
}

async function fetchStats() {
  const { data } = await apiClient.get("/admin/stats/overview");
  Object.assign(stats, data.data);
}

async function fetchDisplaySettings() {
  const { data } = await apiClient.get("/admin/reflections/meta/display-settings");
  Object.assign(displaySettings, data.data);
}

async function fetchReflectionMeta() {
  const [typeRes, projectRes] = await Promise.all([
    apiClient.get("/admin/reflections/meta/reflection-types"),
    apiClient.get("/admin/reflections/meta/teaching-projects"),
  ]);
  reflectionTypes.value = typeRes.data.data.list;
  teachingProjects.value = projectRes.data.data.list;
  syncMetaDrafts();
}

async function fetchReflections() {
  loading.value = true;
  try {
    const { data } = await apiClient.get("/admin/reflections", {
      params: {
        page: pagination.page,
        page_size: pagination.page_size,
        keyword: filters.keyword || undefined,
        audit_status: filters.audit_status || undefined,
        display_status: filters.display_status || undefined,
        reflection_type_id: filters.reflection_type_id || undefined,
        teaching_project_id: filters.teaching_project_id || undefined,
        is_top: filters.is_top,
      },
    });
    reflections.value = data.data.list;
    Object.assign(pagination, data.data.pagination);
  } finally {
    loading.value = false;
  }
}

async function refreshAll() {
  if (!isAuthenticated.value) return;
  await Promise.all([
    fetchCurrentUser(),
    fetchStats(),
    fetchReflections(),
    fetchReflectionMeta(),
    fetchDisplaySettings(),
  ]);
}

async function saveDisplaySettings() {
  displaySettingsLoading.value = true;
  try {
    await apiClient.patch("/admin/reflections/meta/display-settings", {
      show_view_count: displaySettings.show_view_count,
    });
    ElMessage.success("前台阅读量显示设置已更新");
  } catch (error) {
    console.error(error);
    displaySettings.show_view_count = !displaySettings.show_view_count;
    ElMessage.error("更新阅读量显示设置失败");
  } finally {
    displaySettingsLoading.value = false;
  }
}

async function openReflectionTypeDialog() {
  await fetchReflectionMeta();
  reflectionTypeDialogVisible.value = true;
}

async function openTeachingProjectDialog() {
  await fetchReflectionMeta();
  teachingProjectDialogVisible.value = true;
}

async function openDetail(id: number) {
  try {
    const { data } = await apiClient.get(`/admin/reflections/${id}`);
    const nextDetail = data.data as ReflectionItem;
    detail.value = nextDetail;
    detailForm.reflection_title = nextDetail.reflection_title || "";
    detailForm.reflection_type_id = nextDetail.reflection_type_id ?? undefined;
    detailForm.teaching_project_id = nextDetail.teaching_project_id ?? undefined;
    detailForm.submit_content = nextDetail.submit_content;
    detailForm.display_name = nextDetail.display_name || "";
    detailForm.remarks = nextDetail.remarks || "";
    detailForm.is_featured = nextDetail.is_featured;
    detailForm.is_top = nextDetail.is_top;
    detailForm.is_anonymous = nextDetail.is_anonymous;
    detailVisible.value = true;
  } catch (error) {
    console.error(error);
    ElMessage.error(buildActionErrorMessage(error, "加载详情失败"));
  }
}

async function saveDetail() {
  if (!detail.value) return;
  if (!detailForm.reflection_type_id) {
    ElMessage.warning("请先选择反思类型");
    return;
  }
  if (detailTypeRequiresProject.value && !detailForm.teaching_project_id) {
    ElMessage.warning("当前反思类型必须选择支教项目");
    return;
  }

  saveLoading.value = true;
  try {
    await apiClient.patch(`/admin/reflections/${detail.value.id}`, {
      reflection_title: detailForm.reflection_title,
      reflection_type_id: detailForm.reflection_type_id,
      teaching_project_id: detailTypeRequiresProject.value ? detailForm.teaching_project_id : null,
      submit_content: detailForm.submit_content,
      display_name: detailForm.display_name,
      remarks: detailForm.remarks,
      is_featured: detailForm.is_featured,
      is_top: detailForm.is_top,
      is_anonymous: detailForm.is_anonymous,
    });
    ElMessage.success("保存成功");
    detailVisible.value = false;
    await refreshAll();
  } catch (error) {
    console.error(error);
    ElMessage.error("保存失败");
  } finally {
    saveLoading.value = false;
  }
}

async function approve(id: number) {
  try {
    await apiClient.post(`/admin/reflections/${id}/approve`, { display_status: "visible" });
    ElMessage.success("已审核通过并展示");
    await refreshAll();
  } catch (error) {
    console.error(error);
    ElMessage.error(buildActionErrorMessage(error, "审核失败，请稍后重试"));
  }
}

async function reject(id: number) {
  try {
    await apiClient.post(`/admin/reflections/${id}/reject`, { remarks: "管理员驳回" });
    ElMessage.success("已驳回");
    await refreshAll();
  } catch (error) {
    console.error(error);
    ElMessage.error(buildActionErrorMessage(error, "驳回失败，请稍后重试"));
  }
}

async function toggleVisibility(row: ReflectionItem) {
  try {
    await apiClient.post(`/admin/reflections/${row.id}/visibility`, {
      display_status: row.display_status === "visible" ? "hidden" : "visible",
    });
    ElMessage.success("展示状态已更新");
    await refreshAll();
  } catch (error) {
    console.error(error);
    ElMessage.error(
      buildActionErrorMessage(error, "展示状态更新失败", {
        cannot_show_unapproved_reflection: "未审核通过的内容不能直接展示",
      }),
    );
  }
}

async function toggleTop(row: ReflectionItem) {
  try {
    await apiClient.patch(`/admin/reflections/${row.id}`, { is_top: !row.is_top });
    ElMessage.success(row.is_top ? "已取消置顶" : "已设为置顶");
    await refreshAll();
  } catch (error) {
    console.error(error);
    ElMessage.error(buildActionErrorMessage(error, "置顶状态更新失败"));
  }
}

async function toggleFeatured(row: ReflectionItem) {
  try {
    await apiClient.patch(`/admin/reflections/${row.id}`, { is_featured: !row.is_featured });
    ElMessage.success(row.is_featured ? "已取消精选" : "已设为精选");
    await refreshAll();
  } catch (error) {
    console.error(error);
    ElMessage.error(buildActionErrorMessage(error, "精选状态更新失败"));
  }
}

async function removeReflection(id: number) {
  try {
    await ElMessageBox.confirm("删除后不可恢复，确定继续吗？", "删除确认", {
      type: "warning",
    });
    await apiClient.post(`/admin/reflections/${id}/delete`);
    ElMessage.success("已删除");
    await refreshAll();
  } catch (error) {
    if (isRequestCanceled(error)) {
      return;
    }

    console.error(error);
    ElMessage.error(buildActionErrorMessage(error, "删除失败，请稍后重试"));
  }
}

async function handleMoreAction(row: ReflectionItem, command: MoreAction) {
  if (command === "toggleVisibility") {
    await toggleVisibility(row);
    return;
  }
  if (command === "toggleTop") {
    await toggleTop(row);
    return;
  }
  if (command === "toggleFeatured") {
    await toggleFeatured(row);
    return;
  }
  if (command === "remove") {
    await removeReflection(row.id);
  }
}

async function exportReflections() {
  exportLoading.value = true;
  try {
    const response = await apiClient.get("/admin/reflections/export", {
      params: {
        keyword: filters.keyword || undefined,
        audit_status: filters.audit_status || undefined,
        display_status: filters.display_status || undefined,
        reflection_type_id: filters.reflection_type_id || undefined,
        teaching_project_id: filters.teaching_project_id || undefined,
        is_top: filters.is_top,
      },
      responseType: "blob",
    });

    const filename = getExportFilename(response.headers["content-disposition"]);
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (error) {
    console.error(error);
    ElMessage.error("导出失败");
  } finally {
    exportLoading.value = false;
  }
}

async function createReflectionType() {
  if (!typeCreateForm.name.trim() || !typeCreateForm.code.trim()) {
    ElMessage.warning("请填写类型名称和编码");
    return;
  }

  try {
    await apiClient.post("/admin/reflections/meta/reflection-types", {
      name: typeCreateForm.name.trim(),
      code: typeCreateForm.code.trim(),
      requires_project: typeCreateForm.requires_project,
      is_active: typeCreateForm.is_active,
      sort_order: typeCreateForm.sort_order,
    });
    ElMessage.success("反思类型已新增");
    resetTypeCreateForm();
    await fetchReflectionMeta();
  } catch (error) {
    console.error(error);
    const code = extractApiMessage(error);
    ElMessage.error(code === "reflection_type_code_exists" ? "编码已存在" : "新增反思类型失败");
  }
}

async function saveReflectionType(row: ReflectionTypeItem) {
  if (!row.name.trim() || !row.code.trim()) {
    ElMessage.warning("请填写完整的类型名称和编码");
    return;
  }

  try {
    await apiClient.patch(`/admin/reflections/meta/reflection-types/${row.id}`, {
      name: row.name.trim(),
      code: row.code.trim(),
      requires_project: row.requires_project,
      is_active: row.is_active,
      sort_order: row.sort_order,
    });
    ElMessage.success("反思类型已保存");
    await fetchReflectionMeta();
  } catch (error) {
    console.error(error);
    const code = extractApiMessage(error);
    ElMessage.error(code === "reflection_type_code_exists" ? "编码已存在" : "保存反思类型失败");
  }
}

async function deleteReflectionType(row: ReflectionTypeItem) {
  await ElMessageBox.confirm(`确定删除反思类型“${row.name}”吗？未被引用时才允许删除。`, "删除确认", {
    type: "warning",
  });

  try {
    await apiClient.delete(`/admin/reflections/meta/reflection-types/${row.id}`);
    ElMessage.success("反思类型已删除");
    await fetchReflectionMeta();
  } catch (error) {
    console.error(error);
    const code = extractApiMessage(error);
    ElMessage.error(
      code === "reflection_type_in_use"
        ? "该反思类型已被反思数据引用，支持编辑，但不能删除"
        : "删除反思类型失败",
    );
  }
}

async function createTeachingProject() {
  if (!projectCreateForm.name.trim()) {
    ElMessage.warning("请填写项目名称");
    return;
  }

  try {
    await apiClient.post("/admin/reflections/meta/teaching-projects", {
      name: projectCreateForm.name.trim(),
      code: projectCreateForm.code.trim() || undefined,
      is_active: projectCreateForm.is_active,
      sort_order: projectCreateForm.sort_order,
    });
    ElMessage.success("支教项目已新增");
    resetProjectCreateForm();
    await fetchReflectionMeta();
  } catch (error) {
    console.error(error);
    const code = extractApiMessage(error);
    ElMessage.error(code === "teaching_project_code_exists" ? "编码已存在" : "新增支教项目失败");
  }
}

async function saveTeachingProject(row: TeachingProjectItem) {
  if (!row.name.trim()) {
    ElMessage.warning("请填写项目名称");
    return;
  }

  try {
    await apiClient.patch(`/admin/reflections/meta/teaching-projects/${row.id}`, {
      name: row.name.trim(),
      code: row.code?.trim() || undefined,
      is_active: row.is_active,
      sort_order: row.sort_order,
    });
    ElMessage.success("支教项目已保存");
    await fetchReflectionMeta();
  } catch (error) {
    console.error(error);
    const code = extractApiMessage(error);
    ElMessage.error(code === "teaching_project_code_exists" ? "编码已存在" : "保存支教项目失败");
  }
}

async function deleteTeachingProject(row: TeachingProjectItem) {
  await ElMessageBox.confirm(`确定删除支教项目“${row.name}”吗？未被引用时才允许删除。`, "删除确认", {
    type: "warning",
  });

  try {
    await apiClient.delete(`/admin/reflections/meta/teaching-projects/${row.id}`);
    ElMessage.success("支教项目已删除");
    await fetchReflectionMeta();
  } catch (error) {
    console.error(error);
    const code = extractApiMessage(error);
    ElMessage.error(
      code === "teaching_project_in_use"
        ? "该支教项目已被反思数据引用，支持编辑，但不能删除"
        : "删除支教项目失败",
    );
  }
}

async function resetFilters() {
  filters.keyword = "";
  filters.audit_status = "";
  filters.display_status = "";
  filters.reflection_type_id = undefined;
  filters.teaching_project_id = undefined;
  filters.is_top = undefined;
  pagination.page = 1;
  await fetchReflections();
}

async function handlePageChange(page: number) {
  pagination.page = page;
  await fetchReflections();
}

async function handlePageSizeChange(size: number) {
  pagination.page_size = size;
  pagination.page = 1;
  await fetchReflections();
}

async function handleLogout() {
  try {
    await apiClient.post("/admin/logout");
  } catch (error) {
    console.error(error);
  }

  clearAdminToken();
  isAuthenticated.value = false;
  currentUser.value = null;
  reflections.value = [];
  ElMessage.success("已退出");
}

onMounted(async () => {
  window.addEventListener("resize", handleResize);
  if (!isAuthenticated.value) {
    return;
  }

  try {
    await refreshAll();
  } catch (error) {
    console.error(error);
    clearAdminToken();
    isAuthenticated.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>
