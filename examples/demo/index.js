/*
<div>
  <div>
    <ul>
      <li v-for="item in list">{{item.item}}</li>
    </ul>
    <div class="test1"><p>1111</p></div>
    <div class="test2"><p>{{str}}</p></div>
  </div>
  <div><p>{{message}}</p></div>
  <div><p>2222</p></div>
</div>
*/
with(this){
  return
    _c('div',[
      _c('div',[
          _c('ul',
            _l((list),function(item){
              return _c('li',[
                _v(_s(item.item))
              ])
            }),0),
          _v(" "),
          _m(0),
          _v(" "),
          _c('div',{staticClass:"test2"},[
            _c('p',[
              _v(_s(str))
            ])
          ])]
        ),
        _v(" "),
        _c('div',[
          _c('p',[
            _v(_s(message))
          ])
        ]),
        _v(" "),
        _m(1)
      ])
}
