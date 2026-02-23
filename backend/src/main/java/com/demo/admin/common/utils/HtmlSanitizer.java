package com.demo.admin.common.utils;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

/**
 * HTML 内容净化工具
 */
@Component
public class HtmlSanitizer {

    private static final Safelist NOTICE_SAFE_LIST = Safelist.relaxed()
            .addAttributes("a", "target", "rel");

    public String sanitize(String html) {
        if (html == null) {
            return null;
        }
        return Jsoup.clean(html, NOTICE_SAFE_LIST);
    }
}
