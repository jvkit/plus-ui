     <template>
       <div class="app-container">
         <el-row :gutter="10" class="mb8">
           <el-col :span="1.5">
             <el-button type="primary" plain icon="Plus"
   v-hasPermi="['procurement:test:add']">新增</el-button>
           </el-col>
           <el-col :span="1.5">
             <el-button type="danger" plain icon="Delete"
   v-hasPermi="['procurement:test:remove']">删除
   </el-button>
           </el-col>
         </el-row>
         <div>测试页面内容</div>
       </div>
     </template>

     <script setup lang="ts">
     // 暂时空着
     </script>