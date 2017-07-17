/**
 * Created by 迟猛 on 2017/7/12.
 */

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
    Nenu.event.msg({
      isClose: false,
      title: '会议室已经被预定，请选择其他时间',
      execute: function (close) {
        $ol.children(".ui-selected").removeClass('ui-selected')
        close();
      }
    })
  }

  function createMeeting($ol, iframeConfig, selectedArr ) {
    Nenu.event.ifreame(iframeConfig);

    Nenu.open.end = function () {
      var dataFromChildren = Nenu.open.data.parent
      if (!$.isEmptyObject(dataFromChildren)) {

        var selectedCover = isSelectedCover(dataFromChildren, selectedArr)
        if (selectedCover) {
          roomOccupied($ol)
        } else {
          var diffMs = ( moment(dataFromChildren.end).format("x") - moment(dataFromChildren.start).format("x") )
          var intevalMs = ( iframeConfig.neData.timeDistribution.interval * 60 * 60 * 1000 )
          var selectedNumber = diffMs / intevalMs + 1
          var $firstLi = getLiByIndex($ol, dataFromChildren.start)
          var $cover = renderCover(dataFromChildren.meetingName, selectedArr.length)
          setCoverCSS($cover, $firstLi, selectedNumber)
          $firstLi.before($cover)

          selectedArr.push(dataFromChildren)
          Nenu.open.data.parent = null
        }
      } else {
        $ol.children(".ui-selected").removeClass('ui-selected')
      }
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
      Nenu.event.msg({
        isClose   : true,
        shadeClose: true,
        time: 1000,
        title: '请先选择会议室',
        close: function () {
          $ol.children(".ui-selected").removeClass('ui-selected')
        }
      })
      return false
    } else {
      return true
    }
  }

  var neSelectableTime = {
    init: function (userConfig) {
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

            Nenu.event.ifreame(iframeConfig)
          }
          else if ( moment( $selected.data( config.timeIndex ), config.timeDistribution.timeFormat ).isBefore( new Date() ) ) {
            Nenu.event.msg( {
              isClose   : true,
              shadeClose: true,
              //todo 自动关闭时间 不起作用
              time: 100,
              title: '所选时间已过期',
              close: function () {
                $ol.children(".ui-selected").removeClass('ui-selected')
              }
            } )
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
              url: 'administration/meetingRoom/meetingDialog.html',
              neData: {
                newSelected: newSelected,
                date: config.date,
                room: config.room.roomName,
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
  }
