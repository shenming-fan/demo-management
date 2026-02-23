package ${packageName}.modules.${moduleName}.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import ${packageName}.modules.${moduleName}.entity.${className};
import ${packageName}.modules.${moduleName}.mapper.${className}Mapper;
import ${packageName}.modules.${moduleName}.service.${className}Service;
import org.springframework.stereotype.Service;

/**
 * ${functionName} Service 实现
 *
 * @author ${author}
 * @date ${date}
 */
@Service
public class ${className}ServiceImpl extends ServiceImpl<${className}Mapper, ${className}> implements ${className}Service {
}
