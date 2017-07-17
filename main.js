$( function () {
  /**
   * Created by 迟猛 on 2017/6/29.
   */

  var neSelectableTime = ( function () {
    var config = null

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
      //todo 阻塞bug
      layer.msg({
        isClose: false,
        title: '会议室已经被预定，请选择其他时间',
        execute: function (close) {
          $ol.children(".ui-selected").removeClass('ui-selected')
          close();
        }
      })
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

    function hasRoom( $ol ) {
      if ( $.isEmptyObject( config.room ) ) {
        layer.msg( '请先选择会议室',{
          time: 1000,
        } ,function () {
          $ol.children(".ui-selected").removeClass('ui-selected')
        })
        return false
      } else {
        return true
      }
    }

    return function (userConfig) {
      config = _.extend({ timeIndex: "timeindex" }, userConfig)
      var $ol = config.$ol
      var selectedArr = config.selectedArr
      var tempSelected = []

      $ol.selectable({
        selected: function (event, ui) {
          //点击显示会议信息
          var $selected = $(ui.selected)
          if ( $( ".ui-selected" ).length === 1 && $selected.is(".jc-cover")) {
            var meetingData = selectedArr[$selected.data("coverindex")]

            var iframeConfig = {
              title: meetingData.meetingName,
              url: 'administration/meetingRoom/showMeetingDialog.html',
              neData:_.extend( {}, meetingData, {
                timeDistribution: config.timeDistribution
              } ),
              height: '500px',
              width: '500px'
            }


            //todo layer 弹层显示会议室被预订情况
            layer.ifreame(iframeConfig)
          }
          else if ( moment( $selected.data( config.timeIndex ), config.timeDistribution.timeFormat ).isBefore( new Date() ) ) {
            alert("所选时间已过期")
            $ol.children(".ui-selected").removeClass('ui-selected')
            return
            layer.alert('所选时间已过期', function(index){
              $ol.children(".ui-selected").removeClass('ui-selected')
              // layer.close(index);
            });
          }

        },
        stop: function (e, u) {
          if ( !hasRoom( $ol ) ) return

          var selectedLi = $ol.children(".ui-selected")
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
              title: "会议室预定",
              neData: {
                newSelected: newSelected,
                date: config.date,
                room: config.room.text,
                timeDistribution: config.timeDistribution,
                orderer: config.orderer
              },
              height: '600px',
              width: '500px'
            }
            createMeeting($ol, iframeConfig, selectedArr)
          }

          tempSelected = []
          newSelected = {}
        }
      });

      renderSelectedTime( $ol, selectedArr )
    }
  } )()

  function timeInfoScroll( direction, width, callback, element ) {
    if ( direction === "left" && page !== 1  ) {
      $( ".meetingRoom-scrollButton-wrapper span" ).removeClass( "scroll-disable" )
      $( ".timeIndiacator" ).remove()
      page--
      if ( page === 1 ) {
        $( element ).addClass( "scroll-disable" )
      }
      $( ".jc_time_scroll" ).animate(  {
        "scrollLeft":  "-=" + width
      } , callback )
    } else if ( direction === "right" && page !== maxPage ) {
      $( ".meetingRoom-scrollButton-wrapper span" ).removeClass( "scroll-disable" )
      $( ".timeIndiacator" ).remove()
      page++
      if ( page === maxPage ) {
        $( element ).addClass( "scroll-disable" )
      }
      $( ".jc_time_scroll" ).animate(  {
        "scrollLeft":  "+=" + width
      } , callback )
    }
  }

  function rerenderSelectedTime() {
    activeOption.date = $( "#jc_meetingRoom_date" ).val()
    var roomId = $( "#jc-meetingRoom-selectRoom" ).val()
    activeOption.room = _.find( roomsData, function ( item ) {
      return item.id == roomId
    } )


    var neSelectableTimeConfig = {
      room: activeOption.room,
      date: activeOption.date,
      orderer: activeOption.orderer,
      $ol:  $('#jc_timeList'),
      timeDistribution: timeDistribution,
      timeArr: timeArr,
      selectedArr: [  ]
    }
  }

  function calTimeItemIndex( timeArr, timeDistribution  ) {
    var rel
    var now = moment( new Date())
    timeArr.some( function ( item, index ) {
      if ( now.isBefore( moment( item, timeDistribution.timeFormat ) ) ) {
        rel = index
        return true
      }
      return false
    } )
    return rel
  }

  function renderTimeIndiacator( timeItemIndex ) {
    $( ".timeIndiacator" ).remove()
    var position = $( "#jc_timeList li:nth-of-type(" + (timeItemIndex ) + " )" ).offset()
    $( "body" ).append( $( "<span class='timeIndiacator'></span>" ).css( {
      left: position.left
    } ) )
  }

  function renderPassedTime( timeItemIndex ) {
    var timeInfoIndex = ( timeItemIndex - 2 ) * timeDistribution.interval
    $( "#jc-timeInfo li" ).removeClass( "passedTime" )
    if ( timeInfoIndex % 1 !== 0  ) {
      timeInfoIndex =  Math.ceil( timeInfoIndex )
    } else {
      timeInfoIndex = timeInfoIndex + 1
    }
    $( "#jc-timeInfo li:nth-of-type("  + timeInfoIndex  + " )" ).prevAll().addClass( "passedTime" )
  }

  function setTimeIndiacator( ) {
    var timeItemIndex = calTimeItemIndex( timeArr, timeDistribution )
    renderTimeIndiacator( timeItemIndex )
    renderPassedTime( timeItemIndex )
  }

  function scrollToNow() {
    // moment

  }

  var templete = {
    index: {
      tpl:'{{# for( var i=0,len = d.timeArr.length ; i < len; i++ ){ }}<li class="ui-widget-content" data-timeindex="{{ d.timeArr[i] }}" >{{i}}</li> {{#}}}',
      room: "{{# for( var i=0, len= d.rooms.length; i < len; i++ ){ }}" +
      " <label class='btn btn-primary '><input type='radio' autocomplete='off' name='options' data-roomId='{{ d.rooms[i].id }}'>" +
      "<div class='meetingRoomWrapper'><div class='meetingRoom'><span>{{d.rooms[i].text}}({{d.rooms[i].capacity}}人)</span></div><div>{{ (d.rooms[i].hasProjector === true ? '有投影':'无投影') }}</div></div></label> {{# } }}",
      timeInfo: "{{# for( var i=0, len= d.timeInfoArray.length; i < len; i++ ){}}  <li class='timeInfoItem' data-hours='{{i+1}}'>{{d.timeInfoArray[i]}}</li> {{# }}}"
    },
  }

  var timeDistribution = {
    start:0,
    end: 24,
    interval: 0.5,
    dateFormat: "YYYY-MM-DD",
    intervalSize: "hours",
    timeFormat: "YYYY-M-D HH:mm",
  }
  var roomsData = [
    {

      "id": "room-101",
      "text": "会议室101",
      capacity: 10,
      hasProjector: true,
      selectedArr: []
    },
    {
      "id": "room-102",
      "text": "会议室102",
      capacity: 11,
      hasProjector: false,
      selectedArr: []
    }
  ]

  var meetingDateIns = flatpickr("#jc_meetingRoom_date", {
    defaultDate: new Date()
  });
  $("#jc-meetingRoom-selectRoom").select2({
    placeholder: "请选择会议室",
    data: [
      {
        "id": "1",
        "text": "有投影",
        "children": [
          {
            "id": "room-101",
            "text": "会议室101",
          },
          {
            "id": "room-102",
            "text": "会议室102",
          },

        ]
      },
      {
        "id": "0",
        "text": "无会议室",
        "children": [
          {
            "id": "room-201",
            "text": "会议室201",
          },
          {
            "id": "room-202",
            "text": "会议室202",
          }
        ]
      }
    ]
  });

  var activeOption = {
    room: null,
    date: "",
    orderer: "test用户"
  }
  activeOption.date = $( "#jc_meetingRoom_date" ).val()
  activeOption.room = _.find( roomsData, function ( item ) {
    return item.id == $( "#jc-meetingRoom-selectRoom" ).val()
  } )



  var offsetNumber = 16
  var page = 1
  var timeArr = []
  var neSelectableTimeConfig = {
    room: activeOption.room,
    date: activeOption.date,
    orderer: activeOption.orderer,
    $ol:  $('#jc_timeList'),
    timeDistribution: timeDistribution,
    timeArr: timeArr,
    selectedArr: [ ]
  }

  var resizeHandle = _.debounce( function () {
    var timeItemIndex = calTimeItemIndex( timeArr, timeDistribution )
    renderTimeIndiacator( timeItemIndex )
  }, 500 )

  $( "#jc-meetingRoom-selectRoom" ).change( function () {
    rerenderSelectedTime()
  } )

  //todo
  // $( "#jc_meetingRoom_date input" ).attr( "value", moment().format( timeDistribution.dateFormat ))
  $( "#jc_meetingRoom_date " ).attr( "value", moment().format( timeDistribution.dateFormat ))




  $("#jc-meetingRoom-selectRoom").on( "select2:change", function ( e ) {
    rerenderSelectedTime()
  } )


//time ui
  timeDistribution.number = (timeDistribution.end - timeDistribution.start) / timeDistribution.interval

  var dateTime = moment( activeOption.date , timeDistribution.dateFormat )
  timeArr.push(  dateTime.add( timeDistribution.start, timeDistribution.intervalSize ).format( timeDistribution.timeFormat ) )
  for( var i = 0; i < timeDistribution.number ; i++) {
    var timeNode = dateTime.add( timeDistribution.interval , timeDistribution.intervalSize ).format( timeDistribution.timeFormat )
    timeArr.push( timeNode )
  }
  timeArr.pop()
  $('#jc_timeList').html(laytpl(templete.index.tpl).render( {
    timeArr: timeArr
  } ));
  $( "#jc_timeList li" ).outerWidth( 100 / timeArr.length + "%" )

  var timeInfoArray = []
  var timeInfo = moment( "00:00", "HH:mm" )
  for( var j = 0; j < 23; j++ ) {
    timeInfoArray.push( timeInfo.add( 1, "hours" ).format( "LT" ) )
  }
  var timeInfoItemWidth = (  100 / timeArr.length ) * ( 1 / timeDistribution.interval ) + "%"
  var halfTimeInfoItemWidth = ( (  100 / timeArr.length ) * ( 1 / timeDistribution.interval ) / 2 ) + "%"
  $( "#jc-timeInfo" ).html(  laytpl( templete.index.timeInfo ).render( {
    timeInfoArray: timeInfoArray
  } ) ).children( "li" ).outerWidth(  timeInfoItemWidth )
  $( "#jc-timeInfo  .timeInfoItem:first-child" ).css( {
    marginLeft: halfTimeInfoItemWidth
  } )

//render arrow btn
  $( ".meetingRoom-scrollButton-wrapper div" ).outerWidth( timeInfoItemWidth )
  $( ".meetingRoom-scrollButton-wrapper div:first-child span" ).addClass( "scroll-disable" )

//add indicator of time
//!!! 需要在时间列表渲染之后调用
  $( "#jc-meetingRoom-scrollLeft" ).click( function () {
    timeInfoScroll( "left", $( "#jc_timeList li:last-child" ).outerWidth() * ( offsetNumber ) , setTimeIndiacator, this)
  } )
  $( "#jc-meetingRoom-scrollRight" ).click( function () {
    timeInfoScroll( "right",$( "#jc_timeList li:last-child" ).outerWidth() * ( offsetNumber ) ,setTimeIndiacator, this )
  } )

  var maxPage = Math.floor( timeArr.length / offsetNumber )
  neSelectableTime( neSelectableTimeConfig )
  setTimeIndiacator()

  $( window ).resize( function (  ) {
    //todo 对性能的影响
    $( ".timeIndiacator" ).remove()
    resizeHandle()
  } )
} )