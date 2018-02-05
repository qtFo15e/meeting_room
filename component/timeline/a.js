/**
 * Created by 迟猛 on 2018/2/5.
 */
/**
 * Created by 迟猛 on 2018/2/2.
 */

/**
 * Created by 迟猛 on 2018/1/16.
 */
define( [
    "jquery",
    "underscore",
    "singlebackbone",
    "layer",
    "utils",
    "text!./index.html",
    "text!./tpl/report.html",
    "css!_public/libs/buttons/buttons"
], function (
    $,
    _,
    Backbone,
    layer,
    utils,
    indexTpl,
    reportTpl
) {
    var ResourceOperation = Backbone.View.extend( {
        initialize: function ( option ) {
            var _this = this
            var modelKeys = [ "resourceId", "categoryId" , "categoryName", "title"]
            _this.model = option.data
            _this.render()
        },
        reportAjax: function ( reason , resourceId ) {
            return $.ajax({
                type: "PUT",
                url: BASE_URL_ZYK +  'api/Resource/jubao',
                data :{
                    'val':reason,
                    'resid':resourceId
                },
                dataType: "json",
                success: function (data) {
                    if(data.status=='noLogin'){
                        layer.alert( "请先登陆" )
                    }
                }
            })
        },
        favorAjax: function ( resourceId ) {
            return $.ajax({
                type:'PUT',
                url: BASE_URL_ZYK + 'api/resource',
                dataType:"json",
                data:{
                    'id':resourceId,
                    'act':1
                },
                success: function (data) {
                    if(data.status=='noLogin'){
                        layer.alert( "请先登陆" )
                    }
                }
            });
        },
        collectAjax: function ( resourceId, category_id ,category_name, title ) {
            return $.ajax({
                type:'PUT',
                url:BASE_URL_ZYK + 'api/resource',
                dataType:"json",
                data:{
                    'id':resourceId,
                    'act':2,
                    'category_id':category_id,
                    'category_name':category_name,
                    'title':title
                },
                success: function (data) {
                    if(data.status=='noLogin'){
                        layer.alert( "请先登陆" )
                    }
                }
            });
        },
        events: {
            "click #js-report": function () {
                var _this = this
                if ( utils.tipLogin() === false ) return
                layer.open( {
                    type: 1,
                    title: '此资源是否涉及侵权？',
                    content: _.template( reportTpl )({}),
                    btn: ["提交"],
                    yes: function () {
                        var val = $('input[name=rule]:checked').siblings('span').html();
                        if ( val !== undefined ) {
                            _this.reportAjax( val, _this.model.resourceId )
                                .then( function(data){
                                    if ( data.status == '1' ){
                                        layer.msg( "举报成功")
                                    }else {
                                        layer.alert( data.message )
                                    }
                                } )
                        } else {
                            layer.msg( "请选择举报项" )
                        }
                    }
                } )
            },
            "click #js-favor": function () {
                var _this = this
                if ( utils.tipLogin() === false ) return
                _this.favorAjax( _this.model.resourceId )
                    .then( function(data){
                        if(data.status=='success') {
                            _this.render()
                        } else if(data.status=='noLogin'){
                            layer.alert( "请先登陆" )
                        } else {
                            layer.alert( data.msg )
                        }
                    } )
            },
            "click #js-down": function () {


                var _this = this
                if ( utils.tipLogin() === false ) return
                window.location.href = BASE_URL_ZYK + "api/download?id="+_this.model.resourceId;
            },
            "click #js-collect": function () {
                var _this = this
                if ( utils.tipLogin() === false ) return
                _this.collectAjax( _this.model.resourceId, _this.model.categoryId, _this.model.categoryName,  _this.model.title )
                    .then( function(data){
                        if(data.status=='success') {
                            $('#collect').text("已收藏");
                        }
                    } )
            }
        },
        render: function () {
            var _this = this
            _this.model._parent.initAjax( _this.model.resourceId )
                .then( function ( res ) {
                    var data = res.data
                    _this.$el.html( _this.template({
                        data: {
                            hasFavor: !!data.has_favor,
                            favorCount: data.metadata.favorCount,
                            hasStore:!! data.has_store
                        }
                    }))
                } )
        },
        template: _.template( indexTpl ),

    } )
    return ResourceOperation
} )

define( [ "backbone",  "jquery", "underscore", "moment" ], function () {

    var maxPage = Math.floor( timeArr.length / offsetNumber )
    var model = {

    }



    function renderCover(meetingName, index) {
        meetingName = meetingName || '会议' + index

        return $("<div class='jc-cover js-meetingRoom-cover' data-coverindex='" + index + "'> <span> " + meetingName + " </span></div>")
    }

    function setCoverCSS($cover, $firstLi, number) {
        var postion = $firstLi.position()
        var height = $firstLi.outerHeight()
        var width = $firstLi.outerWidth() * number
        $cover.css({
            height: height,
            width: width,
            left: postion.left,
            top: postion.top
        })
    }

    function getLiByIndex($ol, index) {
        return $ol.children("li[data-timeindex='" + index + "']")
    }

    function sortSelected(tempSelected) {
        var newSelected
        if (moment(tempSelected[0]).isAfter(tempSelected[tempSelected.length - 1])) {
            newSelected = {
                start: tempSelected[tempSelected.length - 1],
                end: tempSelected[0]
            }
        } else {
            newSelected = {
                start: tempSelected[0],
                end: tempSelected[tempSelected.length - 1]
            }
        }
        return newSelected
    }

    function isSelectedCover(newSelected, selectedArr) {
        return selectedArr.some(function (item) {
            var atLeft = moment(item.start).isAfter(newSelected.end)
            var atRight = moment(item.end).isBefore(newSelected.start)
            return !( atLeft || atRight )
        })
    }

    function roomOccupied($ol) {
        layer.alert( '会议室已经被预定，请选择其他时间' ,function ( index ) {
            $ol.children(".ui-selected").removeClass('ui-selected')
            layer.close(index);
        } )
    }

    function createMeeting($ol, iframeConfig, selectedArr ) {
        var dataFromChildren = iframeConfig.neData.newSelected
        if (!$.isEmptyObject(dataFromChildren)) {

            var selectedCover = isSelectedCover(dataFromChildren, selectedArr)
            if (selectedCover) {
                roomOccupied($ol)
            } else {
                var diffMs = ( moment(dataFromChildren.end).format("x") - moment(dataFromChildren.start).format("x") )
                var intevalMs = ( iframeConfig.neData.timeDistribution.interval * 60 * 60 * 1000 )
                var selectedNumber = diffMs / intevalMs + 1
                var $firstLi = getLiByIndex($ol, dataFromChildren.start)
                var $cover = renderCover(iframeConfig.neData.room, selectedArr.length)
                setCoverCSS($cover, $firstLi, selectedNumber)
                $firstLi.before($cover)
                selectedArr.push(dataFromChildren)
                //todo zTree 选择参会人员，确定后选中，取消则取消选区样式
            }
        } else {
            $ol.children(".ui-selected").removeClass('ui-selected')
        }
    }

    function renderSelectedTime( $ol, selectedArr ) {
        selectedArr.forEach( function ( item, index ) {
            var selectedNumber = getLiByIndex( $ol, item.start ).nextAll().filter( getLiByIndex( $ol, item.end ).prevAll() ).length + 2
            var $firstLi = getLiByIndex( $ol, item.start )
            var $cover = renderCover( item.meetingName, index)
            setCoverCSS($cover, $firstLi, selectedNumber)
            $firstLi.before($cover)
        } )
    }


    return function ( timelineConfig ) {

        return function ( meetingData ) {

        }

        config = _.extend({ timeIndex: "timeindex" }, userConfig)
        var $ol = config.$ol
        var selectedArr = config.selectedArr
        var tempSelected = []

        $ol.selectable({
            selected: function ( event, ui ) {
                //点击显示会议信息
                var $selected = $(ui.selected)
                if (  $selected.is(".jc-cover")) {
                    var meetingData = selectedArr[$selected.data("coverindex")]

                    //todo layer 弹层显示会议室被预订情况
                } else if ( moment( $selected.data( config.timeIndex ), config.timeDistribution.timeFormat ).isBefore( new Date() ) ) {
                    $ol.children(".ui-selected").removeClass('ui-selected')
                    layer.alert('所选时间已过期', function(index){
                        $ol.children(".ui-selected").removeClass('ui-selected')
                        layer.close(index);
                    });
                    return
                }

            },
            stop: function (event, ui) {


                if ( !hasRoom( $ol ) ) return

                var selectedLi = $ol.children(".ui-selected")
                // todo 移除
                if ((!selectedLi.length) || $(selectedLi[0]).is(".jc-cover")) {
                    return
                }
                selectedLi = selectedLi.filter("li")
                tempSelected = [
                    $(selectedLi[0]).data(config.timeIndex),
                    $(selectedLi[selectedLi.length - 1]).data(config.timeIndex)
                ]

                var newSelected = sortSelected(tempSelected)
                var selectedCover = isSelectedCover(newSelected, selectedArr)

                if (selectedCover) {
                    roomOccupied($ol)
                } else {
                    var iframeConfig = {
                        neData: {
                            newSelected: newSelected,
                            date: config.date,
                            room: config.room.text,
                            timeDistribution: config.timeDistribution,
                            orderer: config.orderer
                        },
                    }
                    createMeeting($ol, iframeConfig, selectedArr)
                }

                tempSelected = []
                newSelected = {}
            }
        });

        renderSelectedTime( $ol, selectedArr )
    }
} )