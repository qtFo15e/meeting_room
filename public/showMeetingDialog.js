define(function (require) {
    'use strict';
    var $ = require( 'jquery' )
    require('mConfig');
    require('neEvent');
    var moment = require( 'moment' )
    var _ = require( 'lodash' )
    //共用魔板
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


    moment( neData.after, neData.timeDistribution.timeFormat ).isBefore( new Date() ) ? $( "#jc_meeting_wrapper" ).hide() : $( "#jc_meeting_wrapper" ).show()
    $( "#jc_meeting_wrapper" ).toggle(  )
    $( "#jc-meetingRoom-orderer" ).text( neData.orderer )
    $( "#jc-meeting-startTimeInfo" ).text( neData.start )
    $( "#jc-meeting-endTimeInfo" ).text( endTimeFix( neData.end, true ) )
    $( "#jc-meeting-remarkInfo" ).text( neData.remark )
    $( ".jc_meetingRoom_numbersList" ).html( laytpl( oTpl.person ).render( {
        peopleArr: neData.numbers
    } ) )


    Nenu.context.event = {
        fnClose:function(){
            options.close()
        },
        fnRemind: function () {
            //todo 会议提醒
            options.close()
        }
    };

});