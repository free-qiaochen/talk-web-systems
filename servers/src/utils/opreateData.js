// 操作数据库
exports.statics = {
  Find: function (query,cb) {
    console.log(query)
    if (!query.where) {
      query.where = {}
    }
    if (!query.limit) {
      query.limit = 100
    }
    if (!query.skip) {
      query.skip = 0
    }
    return this.Find(query.where)
    .limit(query.limit)
    .skip(quer.skip)
    .sort(query.order)
  },
  update: function (query,cb) {
    query.data.updateTime = Date.now()
    return this.update({_id:query.id},query.data)
  }
}

// 使用方法
/* UserSchema.statics = exports.statics
module.Find({
  where:
}) */
