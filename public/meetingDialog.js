
define(function (require) {
    var oTpl = require('./meetingDialog.tpl.js');
    var laytpl = require('jqLaytpl');


    function endTimeFix (endTime, add ) {
        if ( add ) {
            return moment( endTime, neData.timeDistribution.timeFormat ).add( neData.timeDistribution.interval, neData.timeDistribution.intervalSize ).format( neData.timeDistribution.timeFormat )
        } else {
            return moment( endTime, neData.timeDistribution.timeFormat ).subtract( neData.timeDistribution.interval, neData.timeDistribution.intervalSize ).format( neData.timeDistribution.timeFormat )
        }
    }

    var options = Nenu.open.data.child;
    var neData = options.neData;

    var timepickerConfig = {
        todayHighlight: true,
        minuteStep:neData.timeDistribution.interval * 60,
        startView: 3,
        minView:0,
        format: "yyyy-mm-dd hh:ii",
        autoclose: true,
        language: 'zh-CN',
    }

    $('#jc_meetingRoom_startTimepicker').append( $( "<input type='text' readonly value='" + neData.newSelected.start + "' >" ) ).datetimepicker( timepickerConfig );

    $('#jc_meetingRoom_endTimepicker').append( $( "<input type='text' readonly value='" + endTimeFix( neData.newSelected.end ,true ) + "' >" ) ).datetimepicker( timepickerConfig );

    $( "#jc_meetingRoom_remark" ).val( neData.remark )

    $( "#jc_meetingRoom_meetingName" ).val( neData.meetingName )

    $( "#jc_meetingRoom_allDay" ).change( function () {
        var start = moment( neData.date, neData.timeDistribution.dateFormat ).format( neData.timeDistribution.timeFormat )
        var end = moment( neData.date, neData.timeDistribution.dateFormat ).add( 1, "days" ).format( neData.timeDistribution.timeFormat )
        $('#jc_meetingRoom_startTimepicker input').val( start )
        $('#jc_meetingRoom_endTimepicker input').val( end )
    } )

    var selectPeopleDialog =  {
        url    : 'administration/meetingRoom/selectPeopleDialog.html',
        height : '800px',
        width  : '1500px'
    }
    Nenu.context.event = {
        fnSure:function(){
            if ( $( "#jc_meetingRoom_meetingName" ).val() === "") {
                Nenu.event.msg( {
                    isClose   : true,
                    shadeClose: true,
                    time: 3000,
                    title: '请输入会议名'
                } )
                return
            }

            options.setParentData({
                managers: managers,
                numbers: numbers,
                start: $('#jc_meetingRoom_startTimepicker input').val(),
                end: endTimeFix( $('#jc_meetingRoom_endTimepicker input').val() ,false ),
                meetingName: $( "#jc_meetingRoom_meetingName" ).val(),
                remark: $( '#jc_meetingRoom_remark' ).val(),
                orderer: neData.orderer,
                room: neData.room
            })
            options.close()
        },
        openNumbersDialog : _.extend( {}, selectPeopleDialog, {
            title: "参会人员",
            index: 99
        } ),
        openManagersDialog : _.extend( {}, selectPeopleDialog, {
            title: "维护人员",
            index: 88
        } )
    };


    function renderPeople( $ul, peopleArr ) {
        $ul.html( laytpl( oTpl.person ).render( {
            peopleArr: peopleArr
        } ) )
    }
    var numbers = []
    var managers = []
    Nenu.open.end = function ( childIframe ) {
        var dataFromChildren = Nenu.open.data.parent
        //todo index不能自定义值
        if ( childIframe.title === "参会人员" ) {
            renderPeople( $( "#jc_meetingRoom_numbersList" ), dataFromChildren.peopleArr )
        } else if ( childIframe.title === "维护人员" ) {
            renderPeople( $( "#jc_meetingRoom_managersList" ), dataFromChildren.peopleArr )
        }
    }


});