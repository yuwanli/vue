/* @flow */

import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

import modules from './modules/index'
import directives from './directives/index'
import { genStaticKeys } from 'shared/util'
import { isUnaryTag, canBeLeftOpenTag } from './util'

export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,// arr [klass,style,model]
  directives, // {model: function(){},html: function(){},text: function(){}}
  isPreTag,// 检查标签是否是 'pre'
  isUnaryTag,// 标签是否是一元标签
  mustUseProp, // 是否要使用 props 进行绑定
  canBeLeftOpenTag,// 虽然不是一元标签，但却可以自己补全并闭合的标签
  isReservedTag,// 是否是保留的标签
  getTagNamespace,// 获取元素(标签)的命名空间
  staticKeys: genStaticKeys(modules) // 作用是根据编译器选项的 modules 选项生成一个静态键字符串
}
