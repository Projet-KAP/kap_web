<template>
  <div class="table-skeleton">
    <div v-if="showHeader" class="skeleton-header">
      <Skeleton width="200px" height="24px" class="mb-2" />
      <div class="skeleton-controls">
        <Skeleton width="100px" height="32px" class="mr-2" />
        <Skeleton width="80px" height="32px" />
      </div>
    </div>
    
    <div class="skeleton-table">
      <div v-if="type === 'datatable'" class="skeleton-datatable">
        <div class="skeleton-thead">
          <div class="skeleton-row">
            <Skeleton v-for="i in columns" :key="i" width="100%" height="40px" class="skeleton-cell" />
          </div>
        </div>
        <div class="skeleton-tbody">
          <div v-for="row in rows" :key="row" class="skeleton-row">
            <Skeleton v-for="i in columns" :key="i" width="100%" height="48px" class="skeleton-cell" />
          </div>
        </div>
      </div>
      
      <div v-else-if="type === 'dataview'" class="skeleton-dataview">
        <div class="skeleton-grid">
          <div v-for="item in items" :key="item" class="skeleton-card">
            <div class="skeleton-card-header">
              <Skeleton shape="circle" size="40px" class="mr-2" />
              <div class="skeleton-card-info">
                <Skeleton width="120px" height="16px" class="mb-1" />
                <Skeleton width="80px" height="12px" />
              </div>
            </div>
            <Skeleton width="100%" height="100px" class="mb-2" />
            <div class="skeleton-card-footer">
              <Skeleton width="60px" height="24px" class="mr-2" />
              <Skeleton width="60px" height="24px" />
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="type === 'treetable'" class="skeleton-treetable">
        <div class="skeleton-thead">
          <div class="skeleton-row">
            <Skeleton v-for="i in columns" :key="i" width="100%" height="40px" class="skeleton-cell" />
          </div>
        </div>
        <div class="skeleton-tbody">
          <div v-for="row in rows" :key="row" class="skeleton-row">
            <Skeleton v-for="i in columns" :key="i" width="100%" height="48px" class="skeleton-cell" />
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showPagination" class="skeleton-pagination">
      <Skeleton width="300px" height="32px" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'datatable',
    validator: (value) => ['datatable', 'dataview', 'treetable'].includes(value)
  },
  columns: {
    type: Number,
    default: 5
  },
  rows: {
    type: Number,
    default: 6
  },
  items: {
    type: Number,
    default: 6
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  showPagination: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.table-skeleton {
  width: 100%;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.skeleton-controls {
  display: flex;
  gap: 0.5rem;
}

.skeleton-table {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.skeleton-datatable,
.skeleton-treetable {
  width: 100%;
}

.skeleton-thead {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.skeleton-row {
  display: flex;
  width: 100%;
}

.skeleton-cell {
  flex: 1;
  margin: 0;
  border-right: 1px solid #e2e8f0;
}

.skeleton-cell:last-child {
  border-right: none;
}

.skeleton-tbody .skeleton-row {
  border-bottom: 1px solid #e2e8f0;
}

.skeleton-tbody .skeleton-row:last-child {
  border-bottom: none;
}

.skeleton-dataview {
  padding: 1rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background-color: #ffffff;
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.skeleton-card-info {
  flex: 1;
}

.skeleton-card-footer {
  display: flex;
  justify-content: space-between;
}

.skeleton-pagination {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .skeleton-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style> 