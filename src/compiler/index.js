/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // finalOptions
  const ast = parse(template.trim(), options)
  console.log(ast)
  if (options.optimize !== false) {// 使最优化
    optimize(ast, options)//检测每一颗树是否是静态结点（生成之后DOM不会再改变）
  }
  const code = generate(ast, options)
  console.log(code.render)
  console.log('success')
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
