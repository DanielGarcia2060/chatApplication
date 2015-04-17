.service('MessagesCache',['$cacheFactory',function ($cacheFactory) {

	var MessagesCache=$cacheFactory('MessagesCache');
	var allKeys=[];

	return {
		put:function (key, val) {
			var index = allKeys.indexOf(key);
			if(index === -1){
				allKeys.push(key);
				return MessagesCache.put(key, val);
			}
			return MessagesCache.get(key);
		}
		,get:function (key) {
			return MessagesCache.get(key)||this.put(key,angular.element('<div id="chat_window"></div>'));
		}
		,remove:function (key) {
			var index = allKeys.indexOf(key);
			if(index !== -1){
				allKeys.splice(index,1);
				return MessagesCache.remove(key);
			}
		}
		,keys:function () {
			return allKeys;
		}
	};
}])