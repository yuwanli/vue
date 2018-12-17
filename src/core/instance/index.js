import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)//定义了_init的方法
stateMixin(Vue)// 定义了三个方法 set delete watch
eventsMixin(Vue)// 添加了4个方法 on once off emit
lifecycleMixin(Vue)// 定义了三个方法 _update forceUpdate destroy
renderMixin(Vue)// 添加了一系列的方法 以及_render nextTick

export default Vue
