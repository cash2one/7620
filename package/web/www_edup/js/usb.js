var space;
var pathNext;
var viewType;
var pageNumber;
var cpUrl;
var spaceData = '';
var navDataVideo = '';
var navDataMusic = '';
var navDataTxt = '';
var navDataImage = '';
var navDataPac = '';
var navNum;
var menuNum;
var pageStart;
var fileS;
var fSize;
var fFoldNum;
var oldFiles;
var MenuMem;
/*\
 * 获取usb存储信息
 */
function getUsbSpace(status, type) {
    $.ajaxSettings.async = false;
    $.getJSON(actionUrl + 'fname=sys&opt=storage&function=get&type=info&t=' + Math.random(), function (data) {
        if (type != 1) {
            layer.closeAll();
        }
        if (data.error == 0) {
            spaceData = data;
//            spaceData = $.data(document.getElementById('usb_data'), data);
            spaceUsb(spaceData, status);
        } else {
            getMsg(getErrorCode(data.error));
        }
    });
}
/*
 * 获取usb存储文件夹信息
 */
function getUsbFile(url, start, num, startType) {
    var html = '';
    $.ajaxSettings.async = false;
//    url = url.replace(/[\ /][\ /]/g, '/');
    url = encodeURIComponent(url);
    $.getJSON(actionUrl + 'fname=sys&opt=storage&function=get&type=dir&path=' + url + '&start=' + start + '&num=' + num + '&t=' + Math.random(), function (data) {
        if (data.error == 0) {
            var dir = data.dir, dir_len = dir.length, dirName = '';
            url = decodeURIComponent(url);
            menuNum = dir_len;
            if (url.split('/').length >= 3 && startType != 1) {
                html += '<li><a href="javascript:void(0);" path="' + url + '" class="parent_path" parent="1"><div class="file-icon folder-icon"><img class="thumb" style="visibility:hidden;"></div>';
                html += '<div class="file-name">Parent directory...</div>';
                html += '<div class="file-size fl">&nbsp</div></a></li>';
            }
            if (dir_len > 0) {
                html = listView(html, url, dir, dir_len, dirName);
            }
            if ($("#usb_nav a").eq(0).hasClass('selected') === false) {
                $("#usb_nav a").removeClass('selected');
            }
            $(".creat-btn").show();
            $(".upload-btn").show();
            if (startType == 1) {
                $("#list_view_box").append(html);
            } else {
                $("#list_view_box").empty().html(html);
            }
            if ($(".viewmode a").parent().hasClass('gridmode')) {
                $(".viewmode a").click();
            }
            btnClick();
        } else {
//            if (data.error == 10002) {
//                getUsbSpace();
//            } else {
            getMsg(getErrorCode(data.error));
//            }
        }
    });
}

function fileRm(type, url, status) {
//    if ($.browser.msie || $.browser.mozilla) {
//        url = encodeURIComponent(url);
//    }
//    url = url.replace(/[\ /][\ /]/g, '/');
//    console.log($.browser);
//    if ($.browser.msie) {
//        if (type == 'mkdir') {
//            url = encodeURI(url);
//        } else if (type == 'cp') {
//            url = decodeURI(url);
//        }
//    } else if ($.browser.mozilla) {
//        url = encodeURI(url);
//    }

    $.ajaxSettings.async = false;
    $.getJSON(actionUrl + 'fname=sys&opt=storage&function=set&type=act&act=' + type + '&' + url + '&t=' + Math.random(), function (data) {
        if (data.error == 0) {
//            if ($.browser.msie || $.browser.mozilla) {
//                url = decodeURIComponent(url);
//            }
            if (type == 'mkdir') {
                getMsg('Success!');
                getUsbFile($(".parent_path").attr('path'), 1, 20);
            } else {
                getInfo(type, status);
            }
        } else {
            getMsg(getErrorCode(data.error));
        }
    });
}

function getInfo(type, status) {
    if (type == 'cp') {
        $("#progressBar_do_sch").hide();
        $("#progressBarTxt_sch").hide();
        $("#usbcp").show().text('Copying...，Waiting');
    } else {
        $("#progressBar_do_sch").show();
        $("#progressBarTxt_sch").show();
        $("#usbcp").hide();
    }
    loading_content($("#uploadLay_sch"));
    var ProgressBar = {
        maxValue: 100,
        value: 0,
        SetValue: function (aValue) {
            this.value = aValue;
            if (this.value >= this.maxValue)
                this.value = this.maxValue;
            if (this.value <= 0)
                this.value = 0;
            var mWidth = this.value / this.maxValue * $("#progressBar_do_sch").width() + "px";
            $("#progressBar_Track_sch").css("width", mWidth);
            $("#progressBarTxt_sch").html(this.value + "%");
        }
    }
    ProgressBar.maxValue = 100;
    var index = 0;
    var mProgressTimer = window.setInterval(function () {
        $.ajaxSettings.async = false;
        $.getJSON(actionUrl + 'fname=sys&opt=storage&function=set&type=act&act=dump&info=' + type + '&t=' + Math.random(), function (data) {
            var msg = '';
            if (type == 'cp') {
                msg = 'copy';
            } else if (type == 'rm') {
                msg = 'delete';
            } else if (type == 'mv') {
                msg = 'cut';
                if (status == 2) {
                    msg = 'rename';
                }
            }
            if (data.error == 0) {
                index = data.sch;
                ProgressBar.SetValue(index);
                if (index == 100) {
                    window.clearInterval(mProgressTimer);
                    var newListUrl = $(".parent_path").attr('path');
                    var nav = $("#usb_nav a"), cl = nav.hasClass('selected'), inde = 0;
                    nav.each(function (index) {
                        if ($(this).hasClass('selected')) {
                            inde = index;
                        }
                    });
                    var str = nav.eq(inde).text();
                    getMsg(msg + ' completed!');
                    setTimeout(function () {
                        ProgressBar.SetValue(0);
                        layer.closeAll();
                        if (inde != 0) {
                            type = usbNavType(str);
                            usbNav(type, 1, 20);
                        } else {
                            getUsbFile(newListUrl, 1, 20);
                        }
                        btnClick();
                        if (type == 'mv') {
                            $.cookie('url', null);
                            $.cookie('type', null);
                        }
                        setTimeout(function () {
                            getUsbSpace(1);
                        }, 2000);
                    }, 1000);
                }
            } else {
                window.clearInterval(mProgressTimer);
                getMsg(msg + 'failed,error code：' + getErrorCode(data.error));
                setTimeout(function () {
                    layer.closeAll();
                }, 3000);
            }
        });
    }, 1000);
}

function usbNav(type, start, num, navType) {
    $.ajaxSettings.async = false;
    $.post(actionUrl + 'fname=sys&opt=storage&function=set&type=file&if=' + type + '&path=' + space.path + '&start=' + start + '&num=' + num + '&t=' + Math.random(), function (data) {
        layer.closeAll();
        if (data.error == 0) {
//            if (navType != 1) {
//                navTypeData(data, type);
//            }
            navHtml(data, navType);
            btnClick();
        } else {
            getMsg(getErrorCode(data.error));
        }
    }, 'json');
}

function bytesToSize(bytes) {
    if (bytes === 0)
        return '0 B';
    var k = 1024,
            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function width(type) {
    var width;
    switch (type) {
        case 'video':
            width = (space.video[1] / space.total * 100).toFixed(6) + '%';
            $("#tank_video").attr('style', 'width:' + width).attr('title', width);
            break;
        case 'pic':
            width = (space.pic[1] / space.total * 100).toFixed(6) + '%';
            $("#tank_image").attr('style', 'width:' + width).attr('title', width);
            break;
        case 'txt':
            width = (space.txt[1] / space.total * 100).toFixed(6) + '%';
            $("#tank_filebag").attr('style', 'width:' + width).attr('title', width);
            break;
        case 'music':
            width = (space.music[1] / space.total * 100).toFixed(6) + '%';
            $("#tank_music").attr('style', 'width:' + width).attr('title', width);
            break;
        case 'pack':
            width = (space.pack[1] / space.total * 100).toFixed(6) + '%';
            $("#tank_bag").attr('style', 'width:' + width).attr('title', width);
            break;
        case 'other':
            width = (space.other[1] / space.total * 100).toFixed(6) + '%';
            $("#tank_other").attr('style', 'width:' + width).attr('title', width);
            break;
    }
}

function format(timestamp) {
    var time = new Date(timestamp);
    var year = time.getFullYear();
    var month = (time.getMonth() + 1) > 9 && (time.getMonth() + 1) || ('0' + (time.getMonth() + 1))
    var date = time.getDate() > 9 && time.getDate() || ('0' + time.getDate())
    var hour = time.getHours() > 9 && time.getHours() || ('0' + time.getHours())
    var minute = time.getMinutes() > 9 && time.getMinutes() || ('0' + time.getMinutes())
    var second = time.getSeconds() > 9 && time.getSeconds() || ('0' + time.getSeconds())
    var YmdHis = year + '-' + month + '-' + date
            + ' ' + hour + ':' + minute + ':' + second;
    return YmdHis;
}

function checkClass(name, status) {
    var type = '', typeClass = '';
    if (status != 1) {
        type = name.split('.').pop();
    } else {
        type = name;
    }
    typeClass = 'list-file-icon list-' + type + '-icon';
    return typeClass;
}

function getFileInfo(path) {
    var info = {};
    info.name = path.split('/').pop();
    info.type = path.split('.').pop();

    return info;
}

function listView(html, url, dir, dir_len, dirName) {
    fSize = 0, fFoldNum = 0;
    var type = '';
    for (var i = 0; i < dir_len; i++) {
        if (dir[i].name != '') {
            html += '<li>';
            dirName = url + '/' + dir[i].name;
            dirName = dirName.replace(/[\ /][\ /]/g, '/');
            if (dir[i].type == 'D') {
                html += '<span class="chksp"></span><a href="javascript:void(0);" type="D"  data-size=' + dir[i].size + ' path="' + dirName + '" title="' + dir[i].name + '"><div class="file-icon folder-icon"><img class="thumb" style="visibility:hidden;"></div>';
                html += '<div class="file-name">' + dir[i].name + '</div>';
                html += '<div class="file-size fl">&nbsp</div></a>';
            } else if (dir[i].type != 'D') {
                fSize += parseInt(dir[i].size);
                type = dir[i].name.split('.').pop();
                html += '<span class="chksp"></span><a href="' + dirName + '" target="_blank" data-size=' + dir[i].size + ' title=' + dir[i].name + '><div class="file-icon ' + type + '-icon"><img class="thumb" style="visibility:hidden;"></div>';
                html += '<div class="file-name fl">' + dir[i].name + '</div></a>';
                html += '<div class="file-size fl">' + bytesToSize(dir[i].size) + '</div>';
            }
            html += '<div class="file-time fl">' + format(dir[i].time * 1000) + '</div>';
            html += '</li>';
        }
    }
    return html;
}

function getTree(_this, url, width) {
//    url = url.replace(/[\ /][\ /]/g, '/');
    url = encodeURIComponent(url);
    var html = '';
    $.ajaxSettings.async = false;
    $.getJSON(actionUrl + 'fname=sys&opt=storage&function=get&type=dir&path=' + url + '&start=1&num=100' + '&t=' + Math.random(), function (data) {
        if (data.error == 0) {
            var dir = data.dir, dir_len = dir.length, dirName = '';
            width = Number(width) + 15;
            if (dir_len > 0) {
                url = decodeURIComponent(url);
                for (var i = 0; i < dir_len; i++) {
                    if (dir[i].type == 'D' && dir[i].name != '') {
                        html += '<li><div class="treeview-node" data-width="' + width + '" style="padding-left:' + width + 'px;">';
                        dirName = url + '/' + dir[i].name;
                        dirName = dirName.replace(/[\ /=][\ /=]/g, '/');
                        html += '<span class="treeview-node-handler"><em class="tree_icon"></em><em class="folde_icon"></em>';
                        html += '<span data-url="' + dirName + '">' + dir[i].name + '</span></span></div><ul class="treeview treeview-collapse"></ul></li>';
                    }
                }
            }
            cpUrl = _this.find('span').find('span').attr('data-url');
            _this.next().append(html);
        } else {
            getMsg(getErrorCode(data.error));
        }
    });
}

function spaceUsb(data, status) {
    var len = data.info.length;
    if (len == 0) {
        $(".no-usb").show();
        $("#usbmem").hide();
        $("#usb_file").hide();
        setTimeout(function () {
            layer.closeAll();
        }, 500);
    } else {
        $(".no-usb").hide();
        $("#m_12_box").find('.bd-box').show();
        space = data.info[0];
        $("#usedspace").text(bytesToSize(space.used));
        $("#totalspace").text(bytesToSize(space.total));
        for (x in space) {
            width(x);
        }
        if (status != 1) {
            getUsbFile(space.path, 1, 20);
        }
    }
}

function navHtml(data, type) {
    var dir = data.file, dir_len = dir.length, dirName = '', html = '', FileInfo = '', fileType = '', path = space.path;
    navNum = dir_len;
    if (dir_len > 0) {
        for (var i = 0; i < dir_len; i++) {
            html += '<li>';
            FileInfo = getFileInfo(dir[i].path);
            dirName = FileInfo.name;
            fileType = FileInfo.type;
            html += '<span class="chksp"></span><a href="' + path + dir[i].path + '" data-size=' + dir[i].size + ' target="_blank" title="' + dir[i].path + '"><div class="file-icon ' + fileType + '-icon"><img class="thumb" style="visibility:hidden;"></div>';
            html += '<div class="file-name fl">' + dirName + '</div>';
            html += '<div class="file-size fl">' + bytesToSize(dir[i].size) + '</div></a>';
            html += '</li>';
        }
    }
    $(".creat-btn").hide();
    $(".upload-btn").hide();
    $("#checkAll").removeClass('chksp_on');
    if (type == 1) {
        $("#list_view_box").append(html);
    } else {
        $("#list_view_box").empty().html(html);
    }
    if ($(".viewmode a").parent().hasClass('gridmode')) {
        $(".viewmode a").click();
    }
}

function navTypeData(data, type) {
    switch (type) {
        case 'video':
            navDataVideo = data;
            break;
        case 'music':
            navDataMusic = data;
            break;
        case 'pic':
            navDataImage = data;
            break;
        case 'txt':
            navDataTxt = data;
            break;
        case 'pack':
            navDataPac = data;
            break;
    }
}

function navType(type) {
    var data;
    switch (type) {
        case 'video':
            data = navDataVideo;
            break;
        case 'music':
            data = navDataMusic;
            break;
        case 'pic':
            data = navDataImage;
            break;
        case 'txt':
            data = navDataTxt;
            break;
        case 'pack':
            data = navDataPac;
            break;
    }
    return data;
}

function getFoldSize(path) {

}

function getRepeatFile(url, curl) {
    var uList = url.split('&'), uLen = uList.length;
//    $.post()
    for (var i = 0; i < uLen; i++) {
        console.log(uList[i].split('/').pop());
    }
}

function getOldFiles(url) {
//    url = url.replace(/[\ /][\ /]/g, '/');
    var j = 0;
    $.ajaxSettings.async = false;
    $.getJSON(actionUrl + 'fname=sys&opt=storage&function=get&type=dir&path=' + url + '&start=1&num=100', function (data) {
        if (data.error == 0) {
            var dir = data.dir, dir_len = dir.length, dirName = '';
            if (dir_len > 0) {
                oldFiles = new Array();
                for (var i = 0; i < dir_len; i++) {
                    if (dir[i].type == 'F') {
                        j++;
                        oldFiles[j] = dir[i].name;
                    }
                }
            }
        }
    });
}

function getMenuMem(url, type) {
//    url = url.replace(/[\ /][\ /]/g, '/');
//    url = encodeURI(url);
    $.ajaxSettings.async = false;
    $.getJSON(actionUrl + 'fname=sys&opt=storage&function=get&type=size&path=' + url + '&t=' + Math.random(), function (data) {
        if (data.error == 0) {
            MenuMem = data.size;
            if (type == 1) {
                $.cookie('repFiles', 1);
            }
        } else if (data.error == '10005') {
            $.cookie('repFiles', 0);
        } else if (data.error != '10005') {
            getMsg(getErrorCode(data.error));
        }
    });
}