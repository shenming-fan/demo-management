package com.demo.admin.modules.tool.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.demo.admin.common.exception.BusinessException;
import com.demo.admin.modules.tool.entity.GenTable;
import com.demo.admin.modules.tool.entity.GenTableColumn;
import com.demo.admin.modules.tool.mapper.GenTableColumnMapper;
import com.demo.admin.modules.tool.mapper.GenTableMapper;
import com.demo.admin.modules.tool.service.GenService;
import freemarker.template.Configuration;
import freemarker.template.Template;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.io.StringWriter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 代码生成 Service 实现
 */
@Service
public class GenServiceImpl implements GenService {

    @Autowired
    private GenTableMapper genTableMapper;

    @Autowired
    private GenTableColumnMapper genTableColumnMapper;

    private Configuration freemarkerConfig;

    @PostConstruct
    public void init() {
        freemarkerConfig = new Configuration(Configuration.VERSION_2_3_33);
        freemarkerConfig.setClassLoaderForTemplateLoading(
                getClass().getClassLoader(), "templates/gen");
        freemarkerConfig.setDefaultEncoding("UTF-8");
    }

    @Override
    public IPage<GenTable> page(IPage<GenTable> page, String tableName) {
        LambdaQueryWrapper<GenTable> wrapper = new LambdaQueryWrapper<>();
        if (StrUtil.isNotBlank(tableName)) {
            wrapper.like(GenTable::getTableName, tableName);
        }
        wrapper.orderByDesc(GenTable::getCreateTime);
        IPage<GenTable> result = genTableMapper.selectPage(page, wrapper);
        // 加载每个表的列数量
        for (GenTable t : result.getRecords()) {
            long colCount = genTableColumnMapper.selectCount(
                    new LambdaQueryWrapper<GenTableColumn>().eq(GenTableColumn::getTableId, t.getId()));
            t.setColumns(null); // 分页时不返回列详情
        }
        return result;
    }

    @Override
    public List<Map<String, Object>> selectDbTableList(String tableName) {
        return genTableMapper.selectDbTableList(tableName);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void importTables(List<String> tableNames) {
        for (String tableName : tableNames) {
            // 检查是否已导入
            long count = genTableMapper.selectCount(
                    new LambdaQueryWrapper<GenTable>().eq(GenTable::getTableName, tableName));
            if (count > 0) {
                continue;
            }

            // 读取表的列信息
            List<Map<String, Object>> dbColumns = genTableMapper.selectDbColumnList(tableName);
            if (dbColumns.isEmpty()) {
                throw new BusinessException("表 " + tableName + " 不存在或无列信息");
            }

            // 初始化 GenTable
            GenTable table = new GenTable();
            table.setTableName(tableName);
            // 从 information_schema 取 table_comment
            List<Map<String, Object>> dbTables = genTableMapper.selectDbTableList(null);
            for (Map<String, Object> t : dbTables) {
                if (tableName.equals(t.get("tableName"))) {
                    table.setTableComment(String.valueOf(t.get("tableComment")));
                    break;
                }
            }
            table.setClassName(tableNameToClassName(tableName));
            table.setPackageName("com.demo.admin");
            table.setModuleName(guessModuleName(tableName));
            table.setBusinessName(guessBusinessName(tableName));
            table.setFunctionName(StrUtil.isNotBlank(table.getTableComment())
                    ? table.getTableComment().replaceAll("表$", "") : table.getClassName());
            table.setAuthor("admin");

            genTableMapper.insert(table);

            // 初始化列信息
            int sort = 0;
            for (Map<String, Object> col : dbColumns) {
                GenTableColumn column = new GenTableColumn();
                column.setTableId(table.getId());
                column.setColumnName(String.valueOf(col.get("columnName")));
                column.setColumnComment(String.valueOf(col.get("columnComment")));
                String colType = String.valueOf(col.get("columnType"));
                column.setColumnType(colType);
                column.setJavaType(columnTypeToJavaType(colType));
                column.setJavaField(columnNameToJavaField(column.getColumnName()));
                column.setTsType(javaTypeToTsType(column.getJavaType()));
                column.setIsPk("PRI".equals(col.get("columnKey")) ? 1 : 0);
                column.setIsRequired("NO".equals(col.get("isNullable")) && column.getIsPk() == 0 ? 1 : 0);

                // 智能判断是否在列表/编辑中显示
                String fieldName = column.getJavaField();
                boolean isCommonField = isCommonField(fieldName);
                column.setIsList(isCommonField ? 0 : 1);
                column.setIsEdit(isCommonField || column.getIsPk() == 1 ? 0 : 1);
                column.setIsQuery(0);
                column.setQueryType("EQ");
                column.setHtmlType(guessHtmlType(column));
                column.setDictType("");
                column.setSort(sort++);

                genTableColumnMapper.insert(column);
            }
        }
    }

    @Override
    public GenTable getTableWithColumns(Long tableId) {
        GenTable table = genTableMapper.selectById(tableId);
        if (table == null) {
            throw new BusinessException("表不存在");
        }
        List<GenTableColumn> columns = genTableColumnMapper.selectList(
                new LambdaQueryWrapper<GenTableColumn>()
                        .eq(GenTableColumn::getTableId, tableId)
                        .orderByAsc(GenTableColumn::getSort));
        table.setColumns(columns);
        return table;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateGenTable(GenTable table) {
        genTableMapper.updateById(table);
        if (table.getColumns() != null) {
            for (GenTableColumn col : table.getColumns()) {
                if (col.getId() != null) {
                    genTableColumnMapper.updateById(col);
                }
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTable(Long tableId) {
        genTableColumnMapper.deleteByTableId(tableId);
        genTableMapper.deleteById(tableId);
    }

    @Override
    public Map<String, String> previewCode(Long tableId) {
        GenTable table = getTableWithColumns(tableId);
        Map<String, Object> dataModel = buildDataModel(table);

        Map<String, String> result = new LinkedHashMap<>();
        String[] templateNames = {
                "Entity.java.ftl", "Mapper.java.ftl", "Mapper.xml.ftl",
                "Service.java.ftl", "ServiceImpl.java.ftl", "Controller.java.ftl",
                "api.ts.ftl", "index.tsx.ftl"
        };

        for (String tplName : templateNames) {
            try {
                Template template = freemarkerConfig.getTemplate(tplName);
                StringWriter writer = new StringWriter();
                template.process(dataModel, writer);
                result.put(tplName.replace(".ftl", ""), writer.toString());
            } catch (Exception e) {
                result.put(tplName.replace(".ftl", ""), "// 模板渲染失败: " + e.getMessage());
            }
        }

        return result;
    }

    @Override
    public byte[] downloadCode(Long tableId) {
        Map<String, String> codeMap = previewCode(tableId);
        GenTable table = getTableWithColumns(tableId);

        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(bos)) {

            String moduleName = table.getModuleName();
            String className = table.getClassName();
            String packagePath = table.getPackageName().replace(".", "/");

            Map<String, String> filePathMap = new LinkedHashMap<>();
            filePathMap.put("Entity.java", packagePath + "/modules/" + moduleName + "/entity/" + className + ".java");
            filePathMap.put("Mapper.java", packagePath + "/modules/" + moduleName + "/mapper/" + className + "Mapper.java");
            filePathMap.put("Mapper.xml", "mapper/" + className + "Mapper.xml");
            filePathMap.put("Service.java", packagePath + "/modules/" + moduleName + "/service/" + className + "Service.java");
            filePathMap.put("ServiceImpl.java", packagePath + "/modules/" + moduleName + "/service/impl/" + className + "ServiceImpl.java");
            filePathMap.put("Controller.java", packagePath + "/modules/" + moduleName + "/controller/" + className + "Controller.java");
            filePathMap.put("api.ts", "frontend/src/api/" + table.getBusinessName() + ".ts");
            filePathMap.put("index.tsx", "frontend/src/pages/" + moduleName + "/" + table.getBusinessName() + "/index.tsx");

            for (Map.Entry<String, String> entry : codeMap.entrySet()) {
                String fileName = entry.getKey();
                String filePath = filePathMap.getOrDefault(fileName, fileName);
                zos.putNextEntry(new ZipEntry(filePath));
                zos.write(entry.getValue().getBytes("UTF-8"));
                zos.closeEntry();
            }

            zos.finish();
            return bos.toByteArray();
        } catch (Exception e) {
            throw new BusinessException("代码生成失败: " + e.getMessage());
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 构建 FreeMarker 数据模型
     */
    private Map<String, Object> buildDataModel(GenTable table) {
        Map<String, Object> data = new HashMap<>();
        data.put("tableName", table.getTableName());
        data.put("tableComment", table.getTableComment());
        data.put("className", table.getClassName());
        data.put("classname", StrUtil.lowerFirst(table.getClassName()));
        data.put("packageName", table.getPackageName());
        data.put("moduleName", table.getModuleName());
        data.put("businessName", table.getBusinessName());
        data.put("functionName", table.getFunctionName());
        data.put("author", table.getAuthor());
        data.put("date", new java.text.SimpleDateFormat("yyyy-MM-dd").format(new Date()));
        data.put("columns", table.getColumns());

        // 找出主键列
        GenTableColumn pkColumn = null;
        for (GenTableColumn col : table.getColumns()) {
            if (col.getIsPk() == 1) {
                pkColumn = col;
                break;
            }
        }
        data.put("pkColumn", pkColumn);

        // 需要导入的 Java 类型
        Set<String> importTypes = new LinkedHashSet<>();
        for (GenTableColumn col : table.getColumns()) {
            String javaType = col.getJavaType();
            if ("LocalDateTime".equals(javaType)) {
                importTypes.add("java.time.LocalDateTime");
            } else if ("LocalDate".equals(javaType)) {
                importTypes.add("java.time.LocalDate");
            } else if ("BigDecimal".equals(javaType)) {
                importTypes.add("java.math.BigDecimal");
            }
        }
        data.put("importTypes", importTypes);

        // 列表列、查询列、编辑列
        List<GenTableColumn> listColumns = new ArrayList<>();
        List<GenTableColumn> queryColumns = new ArrayList<>();
        List<GenTableColumn> editColumns = new ArrayList<>();
        for (GenTableColumn col : table.getColumns()) {
            if (col.getIsList() == 1) listColumns.add(col);
            if (col.getIsQuery() == 1) queryColumns.add(col);
            if (col.getIsEdit() == 1) editColumns.add(col);
        }
        data.put("listColumns", listColumns);
        data.put("queryColumns", queryColumns);
        data.put("editColumns", editColumns);

        // 权限前缀
        data.put("permissionPrefix", table.getModuleName() + ":" + table.getBusinessName());

        return data;
    }

    /**
     * 表名转类名：sys_user -> SysUser
     */
    private String tableNameToClassName(String tableName) {
        StringBuilder sb = new StringBuilder();
        for (String part : tableName.split("_")) {
            sb.append(StrUtil.upperFirst(part));
        }
        return sb.toString();
    }

    /**
     * 列名转 Java 字段名：user_name -> userName
     */
    private String columnNameToJavaField(String columnName) {
        StringBuilder sb = new StringBuilder();
        String[] parts = columnName.split("_");
        for (int i = 0; i < parts.length; i++) {
            sb.append(i == 0 ? parts[i] : StrUtil.upperFirst(parts[i]));
        }
        return sb.toString();
    }

    /**
     * 数据库类型转 Java 类型
     */
    private String columnTypeToJavaType(String columnType) {
        String type = columnType.toLowerCase();
        if (type.contains("bigint")) return "Long";
        if (type.contains("int")) return "Integer";
        if (type.contains("tinyint(1)")) return "Boolean";
        if (type.contains("decimal") || type.contains("numeric")) return "BigDecimal";
        if (type.contains("float")) return "Float";
        if (type.contains("double")) return "Double";
        if (type.contains("datetime") || type.contains("timestamp")) return "LocalDateTime";
        if (type.contains("date")) return "LocalDate";
        if (type.contains("text") || type.contains("char") || type.contains("varchar")
                || type.contains("enum") || type.contains("set")) return "String";
        if (type.contains("blob") || type.contains("binary")) return "byte[]";
        return "String";
    }

    /**
     * Java 类型转 TypeScript 类型
     */
    private String javaTypeToTsType(String javaType) {
        switch (javaType) {
            case "Integer":
            case "Long":
            case "Float":
            case "Double":
            case "BigDecimal":
                return "number";
            case "Boolean":
                return "boolean";
            default:
                return "string";
        }
    }

    /**
     * 猜测模块名：sys_user -> system, 无前缀 -> custom
     */
    private String guessModuleName(String tableName) {
        if (tableName.startsWith("sys_")) return "system";
        if (tableName.startsWith("gen_")) return "tool";
        int idx = tableName.indexOf('_');
        return idx > 0 ? tableName.substring(0, idx) : "custom";
    }

    /**
     * 猜测业务名：sys_user -> user, sys_dict_type -> dictType
     */
    private String guessBusinessName(String tableName) {
        int idx = tableName.indexOf('_');
        String raw = idx > 0 ? tableName.substring(idx + 1) : tableName;
        return columnNameToJavaField(raw);
    }

    /**
     * 是否通用字段（不需要出现在编辑/列表中）
     */
    private boolean isCommonField(String fieldName) {
        return "createTime".equals(fieldName) || "updateTime".equals(fieldName)
                || "createBy".equals(fieldName) || "updateBy".equals(fieldName)
                || "deleted".equals(fieldName) || "remark".equals(fieldName);
    }

    /**
     * 猜测表单组件类型
     */
    private String guessHtmlType(GenTableColumn column) {
        String type = column.getColumnType().toLowerCase();
        String field = column.getJavaField();

        if (type.contains("text") || type.contains("longtext")) return "textarea";
        if (type.contains("datetime") || type.contains("timestamp")) return "datetime";
        if (type.contains("date")) return "datetime";
        if (field.contains("status") || field.contains("type") || field.contains("gender")) return "select";
        if (type.contains("tinyint(1)")) return "radio";
        return "input";
    }
}
