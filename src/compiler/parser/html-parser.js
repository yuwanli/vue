/*
// 固定的，不区分平台
function createCompileToFunctionFn(compile) {
  return function compileToFunctions(CompilerOptions) {
      compile(template, options)
      //cacheStore
  }
}

function createCompilerCreator(baseCompile) {
  return function createCompiler(baseOptions) {
      function compile(CompilerOptions) {
          //finalOptions = merge(baseOptions,CompilerOptions)
          return baseCompile(finalOptions)
      }
      return {
          compile,
          compileToFunctions:createCompileToFunctionFn(compile)
      }
  };
}

var createCompiler = createCompilerCreator(function baseCompile(compilerOptions) {
  // parse() 生成ast
  // generate()
  return {ast, render, staticRenderFns}
});

// 根据平台区分
let {compile, compileToFunctions} = createCompiler(baseOptions);//基础选项

let {render,staticRenderFns} = compileToFunctions(compilerOptions);//自定义选项
*/

/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag } from 'web/compiler/util'

// Regular Expressions for parsing tags and attributes
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// class =    “test”
// class =    ’stest‘
// class = test
// disabled
// v-for = 'item in list'
//([^\s"'<>\/=]+)
// (=)
// "([^"]*)"+
// '([^']*)'+
// ([^\s"'=<>`]+)
// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
// <div></div> p textarea
// <x:link></x:link>
// >
// />
// </xxx aaa>
const ncname = '[a-zA-Z_][\\w\\-\\.]*' // 标签命名规范（不能有:）
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)
const startTagClose = /^\s*(\/?)>/
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const doctype = /^<!DOCTYPE [^>]+>/i
// #7298: escape - to avoid being pased as HTML comment when inlined in page
const comment = /^<!\--/
const conditionalComment = /^<!\[/

// Special Elements (can contain anything)
//是不是纯文本标签 不往下继续解析
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}

// 对html进行解码
const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
}

/*
  <div id="link-box">
  //注意 href 属性值，链接后面加了一个换行
  <a href="http://hcysun.me
  ">aaaa</a>
  //注意 href 属性值，链接后面加了一个Tab
  <a href="http://hcysun.me	">bbbb</a>
</div>
*/
const encodedAttr = /&(?:lt|gt|quot|amp);/g // ?
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g //?

// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'
/*
//以下这两种写法其实是一样的
 <pre>内容</pre>

 <pre>
  内容</pre>
 */
function decodeAttr (value, shouldDecodeNewlines) {
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  return value.replace(re, match => decodingMap[match])
}

export function parseHTML (html, options) {
  //<article><section><div><h1></section></article>
  // <div><p></p></div>
  const stack = []//用于判断非一元标签是否缺少闭合标签
  const expectHTML = options.expectHTML
  const isUnaryTag = options.isUnaryTag || no //是否是一元标签
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no //是否是可以省略闭合标签的非一元标签
  let index = 0 //当前字符流的读入位置
  let last, lastTag // 剩余html字符串   栈顶的元素
  while (html) {
    last = html
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      // lastTag && isPlainTextElement(lastTag)
      //当前我们正在处理的是纯文本标签里面的内容
      // 非纯本文标签
      let textEnd = html.indexOf('<')
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
          // <!-- -->
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              options.comment(html.substring(4, commentEnd))
            }
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          //<![ ]>
          const conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          //<!DOCTYPE >
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:</xxx>

        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        const startTagMatch = parseStartTag()
        if (startTagMatch) {//<xxx>
          handleStartTag(startTagMatch)
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1)
          }
          continue
        }
      }

      let text, rest, next
      // < 2
      // 1<11112<222<div></div>
      if (textEnd >= 0) {
        //第一个字符是 < 但没有成功匹配标签，或第一个字符不是 < 的字符串
        rest = html.slice(textEnd)
        // console.log(rest)
        // console.log(endTag.test(rest),startTagOpen.test(rest),comment.test(rest),conditionalComment.test(rest))
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
        advance(textEnd)
      }

      if (textEnd < 0) {
        text = html
        html = ''
      }

      if (options.chars && text) {
        options.chars(text)
      }
    } else {//当前我们正在处理的是纯文本标签里面的内容
      // lastTag && isPlainTextElement(lastTag)
      let endTagLength = 0
      const stackedTag = lastTag.toLowerCase()


      const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      const rest = html.replace(reStackedTag, function (all, text, endTag) {
        // all 整个字符串
        // text 第一个捕获组
        // endTag 结束标签
        endTagLength = endTag.length
        // <textarea><!--aaa--></textarea>
        // <textarea>aaa</textarea>aaa
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          // ????
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1)
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    if (html === last) {//纯文本对待
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`)
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag()
  function advance (n) {
    index += n
    html = html.substring(n)
  }

  function parseStartTag () {
    const start = html.match(startTagOpen)
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      let end, attr
      //  class="test" v-for='item in list' disabled ></div>
      // 没有匹配到开始标签的结束部分，并且匹配到了开始标签中的属性
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push(attr)
      }
      if (end) {
        // <div></div>  <br />
        // <mycoponet/>
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash

    if (expectHTML) {
      // 为了和浏览器的行为保持一致
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        // <p></p><h2></h2><p></p>
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        //<p>1111
        //<p><p>one</p>
        //<p>two
        parseEndTag(tagName)
      }
    }
    // <my-component />
    const unary = isUnaryTag(tagName) || !!unarySlash//是否是一元标签

    const l = match.attrs.length
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      // if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
      //   if (args[3] === '') { delete args[3]; }
      //   if (args[4] === '') { delete args[4]; }
      //   if (args[5] === '') { delete args[5]; }
      // }
      const value = args[3] || args[4] || args[5] || ''
      const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines
        // 返回的是boolean
        // 用于标识是否需要对属性值中的换行符或制表符做兼容处理
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs })
      lastTag = tagName
    }

    if (options.start) {// 对外的钩子函数
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }
  // parseEndTag
  function parseEndTag (tagName, start, end) {
    // 检测是否缺少闭合标签
    // 处理 stack 栈中剩余的标签
    // 解析 </br> 与 </p> 标签，与浏览器的行为相同
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    // Find the closest opened tag of the same type
    //<section><div><p><span></div></section>
    // parseEndTag()
    // <p>111
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          // console.log('11111')
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`
          )
        }
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      //</div>
      // </br>
      // </p>
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
