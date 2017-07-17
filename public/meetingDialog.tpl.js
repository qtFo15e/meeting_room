/**
 * Created by 迟猛 on 2017/3/4.
 */
define(function () {
    return {
        person: '{{# for( var i=0,len = d.peopleArr.length ; i < len; i++ ){ }}<li class="">{{ d.peopleArr[i].name }}</li> {{#}}}',
    }
});
