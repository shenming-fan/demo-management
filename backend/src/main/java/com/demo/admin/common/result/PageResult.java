package com.demo.admin.common.result;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 分页结果
 */
@Data
public class PageResult<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 当前页码
     */
    private long current;

    /**
     * 每页数量
     */
    private long size;

    /**
     * 总记录数
     */
    private long total;

    /**
     * 总页数
     */
    private long pages;

    /**
     * 数据列表
     */
    private List<T> records;

    public PageResult() {
    }

    public PageResult(IPage<T> page) {
        this.current = page.getCurrent();
        this.size = page.getSize();
        this.total = page.getTotal();
        this.pages = page.getPages();
        this.records = page.getRecords();
    }

    public static <T> PageResult<T> of(IPage<T> page) {
        return new PageResult<>(page);
    }
}
