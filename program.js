//====================================
//
//超簡単東京感染者グラフ
//Toshihide Iizuka
//
//2021/03/15
//
//====================================

  
//Main
//データ
var KEY_NAME = "全国";
        
//日付配列の生成
var days = new Array();

//新規感染者配列の生成
var newdays = new Array();

//周毎新規感染者配列の生成
var newweeks = new Array();
var newweeksdays = new Array();
        
var minnewday = 999999;
var maxnewday = 0;

//都市リスト配列
var cities = new Array();
var citiesIsLoad = false;

//autoplayモード
var autoplay = false;
var autochangetime = 15;

var isWidget = false;

//darkmode
var isDark = false;

function init() {
    //パラメーター取得
    var params = (new URL(document.location)).searchParams;
    
    //地域データの処理
    try {
        var city = removehtml(params.get("city"));
        if ( city != "" && city != null ) {
            setchangekey(city);
        }
        } catch(e) {
    }
    
    //その他の処理
    try {
        var mode = removehtml(params.get("autoplay"));
        if ( mode == "true" ) { autoplay = true; }
        } catch(e) {
    }
    try {
        var changetime = removehtml(params.get("changetime"));
        if ( changetime != "" && Number(changetime) > 0 ) { autochangetime = Number(changetime); }
        } catch(e) {
    }
    
    //表示の調整
    try {
        var darkmode = removehtml(params.get("darkmode"));
        if ( darkmode == "dark" ) {
            isDark = true;
            document.body.style.color = "white";
            document.body.style.backgroundColor = "black";
        }
    } catch(e) {
    }
    
    try {
        var widgetmode = removehtml(params.get("widgetmode"));
        if ( widgetmode == "widget" ) {
            isWidget = true;
            var form = document.getElementById("form");
            form.style.visibility = "hidden";
            form.style.height = "0px";
            var title = document.getElementById("title");
            title.style.visibility = "hidden";
            title.style.height = "0px";
        }
    } catch(e) { 
    }
    
    //日付フォームの変更
    var startdate = "2020-01-01";//dateToFormatString(nowmonth(), "%YYYY%-%MM%-%DD%");
    var enddate = dateToFormatString(new Date(), "%YYYY%-%MM%-%DD%");
    
    showdateform(startdate, enddate);
    
    //データの読み込み
    loaddata();
}

//Automode
function autoplaymode() {
    //都道府県切り替え
    var index = -1;
    
    do {
        index = Math.round( Math.random()*cities.length);
    } while( cities[index] == "" || cities[index] == null );
    
    
    KEY_NAME = cities[index];
    
    setchangecity();
    
    //自動切り替え
    delayedCall(autochangetime,function(){
        reloaddata();
    });
}
        
//日付に関する関数
function nowmonth() {
    var date = new Date();
    
    //本日が月の10日未満の場合は先月をセットする
    if ( date.getDate() <= 10 ) {
        date.setMonth(date.getMonth() -1 );
    }
    
    //1日をセット
    date.setDate(1);
    
    return date;
}

function showdateform(startvalue, endvalue) {
    var start = document.getElementById("start");
    var end = document.getElementById("end");
    start.value = startvalue;
    start.min = "2020-01-01";
    start.max = endvalue;
    end.value = endvalue;
    end.min = "2020-01-01";
    end.max = endvalue;
}

function checkdaterange(date) {
    try { 
        var start = document.getElementById("start");
        var end = document.getElementById("end");

        var startdate = Date.parse(start.value);
        var enddate = Date.parse(end.value);
        var checkday = Date.parse(date);

        // 現在は2019年3月18日 21:00:00よりも後なら
        var flag = false;
        if ( Number(startdate) <= Number(checkday)  && Number(checkday) <= Number(enddate) ) {

            flag = true;
        } else {
            flag = false;
        }
    } catch(e) {
    }
    return flag;
}

//地域に関する関数

function setchangekey(text) {
    KEY_NAME = text;
}

function changecity() {
    var cty = document.getElementById("cities");
    var index = cty.selectedIndex;
    var value = cty.options[index].value;
    var text  = cty.options[index].text;
    
    KEY_NAME = text;
    
    reloaddata();
}

function setchangecity() {
    var option = document.getElementById("cities").getElementsByTagName("option");
    for( var i=0; i<option.length; i++ ) {
        try { 
            if( option[i].text == KEY_NAME ){
                option[i].selected = true;
                return;
            }
        } catch(e) {
        }
    }
}

function drawcities() {
    var cty = document.getElementById("cities");
    for ( var i=0; i<cities.length; i++ ) {
        var option = document.createElement("option");
        option.text = cities[i];
        option.value = i;
        cty.appendChild(option);
    }
    cty.disabled = false;
    
    setchangecity();
}

//データのロードに関する関数       
function loaddata() {
    //ファイルの読み込み
    //0:日付,1:都道府県コード,2:都道府県名,3:各地の感染者数_1日ごとの発表数,4:各地の感染者数_累計,5:各地の死者数_1日ごとの発表数,6:各地の死者数_累計
    csv_data('https://www3.nhk.or.jp/n-data/opendata/coronavirus/nhk_news_covid19_prefectures_daily_data.csv');
    //csv_data('./sampledata.csv');

    function csv_data(dataPath) {
        const request = new XMLHttpRequest();
        request.addEventListener('load', (event) => {
            const response = event.target.responseText;
            var resArray = response.split("\r");
            
            //1行目を削除した配列を生成する
            for ( var i=1; i<resArray.length; i++ ) {
                var data = resArray[i].split(",");
                var day = data[0];
                var city = data[2];
                var totalday = data[4];
                var newday = data[3];
                
                //プログラム処理用データ取得
                if ( citiesIsLoad == false ) {
                    if ( cities.indexOf(city) == -1 && city != "" && city != null ) {
                        cities.push(city);
                    }
                }
            }
            
            //都市リストの描画
            drawcities();
                
            //1行目を削除した配列を生成する
            for ( var i=1; i<resArray.length; i++ ) {
                try {
                    var data = resArray[i].split(",");
                    var day = data[0];
                    var city = data[2];
                    var totalday = data[4];
                    var newday = data[3];

                    //分析用データ取得
                    //ユーザの指定した地域の時だけ処理する
                    if ( city.indexOf(KEY_NAME) !== -1 ) {
                        //ユーザの指定した範囲のデータを取得する
                        if ( checkdaterange(day) ) {
                            //指定範囲内の場合に処理する
                            days.push(day);

                            //新規感染者
                            newdays.push(newday);

                            //最小と最大の計算
                            if ( maxnewday < Number(newday) ) {
                                maxnewday = Number(newday);
                            }

                            if ( minnewday > Number(newday) ) {
                                minnewday = Number(newday);
                            }
                        }
                    }                
                } catch(e) {
                }                
            }
            
            //データを週毎のデータに生成する
            /*
            //汎用的に計算するため一度週毎の配列を作りそこに入れ込む
            var weeks = new Array();
            var week = new Array();
            var countmax = 7;//データの集積単位
            for ( var i=0; i<newdays.length; i++ ) {
                if ( week.length < countmax || i == newdays.length-1 ) {
                    var newday = newdays[i];
                    week.push(newday);
                } else {
                    weeks.push(week);
                    week = new Array();
                }
            }
            
            alert(weeks);
            */
            
            //周毎日付ラベルの生成
            var countmax = 7;//データの集積単位
            var count = 0;
            for ( var i=0; i<days.length; i++ ) {
                if ( count == countmax || i == days.length-1 ) {
                    var day = days[i];
                    newweeksdays.push(day);
                    count = 0;
                }
                count++;
            }
            
            count = 0;
            var week = 0;
            for ( var i=0; i<newdays.length; i++ ) {
                if ( count == countmax ) {
                    newweeks.push(week);
                    
                    //最小と最大の計算
                    if ( maxnewday < Number(week) ) {
                        maxnewday = Number(week);
                    }

                    if ( minnewday > Number(week) ) {
                        minnewday = Number(week);
                    }
                    
                    week = 0;
                    count = 0;
                } else if ( i == newdays.length-1 ) {
                    var vrweek = week / count * countmax;//データが単位に満たない場合は仮の値を設定
                    week = vrweek;
                    
                    newweeks.push(week);
                    
                    //最小と最大の計算
                    if ( maxnewday < Number(week) ) {
                        maxnewday = Number(week);
                    }

                    if ( minnewday > Number(week) ) {
                        minnewday = Number(week);
                    }
                    
                    week = 0;
                    count = 0;                    
                } else {
                    var  weekdays = newdays[i];
                    week = week + Number(weekdays);
                }
                count++;
            }
            
            //グラフの描画
            drawchart(newweeksdays, newweeks);
            
            //都市データはもう読まない
            citiesIsLoad = true;
            
            //autoplay実行
            if ( autoplay == true ) {
                autoplaymode();
            }
            
        });
        request.open('GET', dataPath, true);
        request.send();
    }
}
        
function reloaddata() {
    //クリア
    var graph = document.getElementById("graph");
    graph.innerHTML = "<canvas id='chart'></canvas>";
    
    days = new Array();
    newdays = new Array();
    newweeks = new Array();
    newweeksdays = new Array();
    
    minnewday = 999999;
    maxnewday = 0;
    
    loaddata(); 
}

//チャートに関する処理
function drawchart(lbl, data) {
    //色変更
    var borderColor = "rgba(255,0,0,1)";
    var backgroundColor = "rgba(0,0,0,0)";
    var fontColor = "rgba(255,0,0,1)";
    
    //Chart表示
    var ctx = document.getElementById("chart");
    var myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: lbl,
        datasets: [
            {
                id: 'y1',
                label: '新規感染者数',
                data: data,
                borderColor: borderColor,
                backgroundColor: backgroundColor
            },
        ],
    },
    options: {
        title: {
            display: true,
                text: KEY_NAME + "（" + lbl[0] + "~" + lbl[lbl.length-1] + "）"
            },
            scales: {
                 yAxes: [{
                    id: 'y1', // set unique name of axis on the right
                    position: 'left',
                    scaleLabel: {
                      display: true,
                      labelString: '新規感染者数',
                      fontColor: fontColor
                    },
                    ticks: {
                      beginAtZero: true,
                      max: maxnewday
                    }
                  }]
            },
        }
    });
}

//その他
function dateToFormatString(date, fmt, locale, pad) {
    // %fmt% を日付時刻表記に。
    // 引数
    //  date:  Dateオブジェクト
    //  fmt:   フォーマット文字列、%YYYY%年%MM%月%DD%日、など。
    //  locale:地域指定。デフォルト（入力なし）の場合はja-JP（日本）。現在他に対応しているのはen-US（英語）のみ。
    //  pad:   パディング（桁数を埋める）文字列。デフォルト（入力なし）の場合は0。
    // 例：2016年03月02日15時24分09秒
    // %YYYY%:4桁年（2016）
    // %YY%:2桁年（16）
    // %MMMM%:月の長い表記、日本語では数字のみ、英語ではMarchなど（3）
    // %MMM%:月の短い表記、日本語では数字のみ、英語ではMar.など（3）
    // %MM%:2桁月（03）
    // %M%:月（3）
    // %DD%:2桁日（02）
    // %D%:日（2）
    // %HH%:2桁で表した24時間表記の時（15）
    // %H%:24時間表記の時（15）
    // %h%:2桁で表した12時間表記の時（03）
    // %h%:12時間表記の時（3）
    // %A%:AM/PM表記（PM）
    // %A%:午前/午後表記（午後）
    // %mm%:2桁分（24）
    // %m%:分（24）
    // %ss%:2桁秒（09）
    // %s%:秒（9）
    // %W%:曜日の長い表記（水曜日）
    // %w%:曜日の短い表記（水）
    var padding = function(n, d, p) {
        p = p || '0';
        return (p.repeat(d) + n).slice(-d);
    };
    var DEFAULT_LOCALE = 'ja-JP';
    var getDataByLocale = function(locale, obj, param) {
        var array = obj[locale] || obj[DEFAULT_LOCALE];
        return array[param];
    };
    var format = {
        'YYYY': function() { return padding(date.getFullYear(), 4, pad); },
        'YY': function() { return padding(date.getFullYear() % 100, 2, pad); },
        'MMMM': function(locale) {
            var month = {
                'ja-JP': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                'en-US': ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'],
            };
            return getDataByLocale(locale, month, date.getMonth());
        },
        'MMM': function(locale) {
            var month = {
                'ja-JP': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                'en-US': ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June',
                          'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'],
            };
            return getDataByLocale(locale, month, date.getMonth());
        },
        'MM': function() { return padding(date.getMonth()+1, 2, pad); },
        'M': function() { return date.getMonth()+1; },
        'DD': function() { return padding(date.getDate(), 2, pad); },
        'D': function() { return date.getDate(); },
        'HH': function() { return padding(date.getHours(), 2, pad); },
        'H': function() { return date.getHours(); },
        'hh': function() { return padding(date.getHours() % 12, 2, pad); },
        'h': function() { return date.getHours() % 12; },
        'mm': function() { return padding(date.getMinutes(), 2, pad); },
        'm': function() { return date.getMinutes(); },
        'ss': function() { return padding(date.getSeconds(), 2, pad); },
        's': function() { return date.getSeconds(); },
        'A': function() {
            return date.getHours() < 12 ? 'AM' : 'PM';
        },
        'a': function(locale) {
            var ampm = {
                'ja-JP': ['午前', '午後'],
                'en-US': ['am', 'pm'],
            };
            return getDataByLocale(locale, ampm, date.getHours() < 12 ? 0 : 1);
        },
        'W': function(locale) {
            var weekday = {
                'ja-JP': ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
                'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            };
            return getDataByLocale(locale, weekday, date.getDay());
        },
        'w': function(locale) {
            var weekday = {
                'ja-JP': ['日', '月', '火', '水', '木', '金', '土'],
                'en-US':  ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'],
            };
            return getDataByLocale(locale, weekday, date.getDay());
        },
    };
    var fmtstr = ['']; // %%（%として出力される）用に空文字をセット。
    Object.keys(format).forEach(function(key) {
        fmtstr.push(key); // ['', 'YYYY', 'YY', 'MMMM',... 'W', 'w']のような配列が生成される。
    })
    var re = new RegExp('%(' + fmtstr.join('|') + ')%', 'g');
    // /%(|YYYY|YY|MMMM|...W|w)%/g のような正規表現が生成される。
    var replaceFn = function(match, fmt) {
    // match には%YYYY%などのマッチした文字列が、fmtにはYYYYなどの%を除くフォーマット文字列が入る。
        if(fmt === '') {
            return '%';
        }
        var func = format[fmt];
        // fmtがYYYYなら、format['YYYY']がfuncに代入される。つまり、
        // function() { return padding(date.getFullYear(), 4, pad); }という関数が代入される。
        if(func === undefined) {
            //存在しないフォーマット
            return match;
        }
        return func(locale);
    };
    return fmt.replace(re, replaceFn);
}
        
function removehtml(str) {
    return str.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'');
}
        
function delayedCall(second, callBack){
    setTimeout(callBack, second * 1000);
}