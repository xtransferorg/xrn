package xrn.modules.debugtools

import java.util.regex.Matcher
import java.util.regex.Pattern

object Utils {

    private val URL_PATTERN: Pattern = Pattern.compile(
        "^(https?|http)://"
                + "(?:\\S+(?::\\S*)?@)?"
                + "(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}"
                + "|localhost"
                + "|\\d{1,3}(\\.\\d{1,3}){3}"
                + "(?::\\d+)?"
                + "(?:/?|[/?]\\S+)$", Pattern.CASE_INSENSITIVE
    )

    fun isValidUrlWithRegex(urlStr: String?): Boolean {
        val matcher: Matcher = URL_PATTERN.matcher(urlStr)
        return matcher.matches()
    }
}