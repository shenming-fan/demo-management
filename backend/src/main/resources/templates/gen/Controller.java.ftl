package ${packageName}.modules.${moduleName}.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import ${packageName}.common.result.PageResult;
import ${packageName}.common.result.R;
import ${packageName}.modules.${moduleName}.entity.${className};
import ${packageName}.modules.${moduleName}.service.${className}Service;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * ${functionName}控制器
 *
 * @author ${author}
 * @date ${date}
 */
@Api(tags = "${functionName}")
@RestController
@RequestMapping("/${moduleName}/${businessName}")
public class ${className}Controller {

    @Autowired
    private ${className}Service ${classname}Service;

    @ApiOperation("分页查询")
    @GetMapping("/page")
    @PreAuthorize("@ss.hasPermi('${permissionPrefix}:list')")
    public R<PageResult<${className}>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<${className}> page = new Page<>(current, size);
        LambdaQueryWrapper<${className}> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(${className}::getCreateTime);
        return R.ok(PageResult.of(${classname}Service.page(page, wrapper)));
    }

    @ApiOperation("查询详情")
    @GetMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('${permissionPrefix}:query')")
    public R<${className}> getById(@PathVariable Long id) {
        return R.ok(${classname}Service.getById(id));
    }

    @ApiOperation("新增")
    @PostMapping
    @PreAuthorize("@ss.hasPermi('${permissionPrefix}:add')")
    public R<Void> create(@Valid @RequestBody ${className} entity) {
        ${classname}Service.save(entity);
        return R.ok();
    }

    @ApiOperation("修改")
    @PutMapping
    @PreAuthorize("@ss.hasPermi('${permissionPrefix}:edit')")
    public R<Void> update(@Valid @RequestBody ${className} entity) {
        ${classname}Service.updateById(entity);
        return R.ok();
    }

    @ApiOperation("删除")
    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.hasPermi('${permissionPrefix}:delete')")
    public R<Void> delete(@PathVariable Long id) {
        ${classname}Service.removeById(id);
        return R.ok();
    }
}
