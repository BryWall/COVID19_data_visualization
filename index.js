
/**const confirmed_url = 'data/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
const deaths_url = 'data/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
const recovered_url = 'data/COVID-19/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';
 **/
const confirmed_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
const deaths_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
const recovered_url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';
const debut_date = new Date("1/22/2020");
const date_now = new Date();



function getDataJsonFromCSV(url) {
    var data = $.ajax({
        url: url,
        dataType: "csv",
        async: false
    }).responseText;

    return JSON.parse(CSVToJSON(data));
}

function getRecoveredNow() {
    var data = getDataJsonFromCSV(recovered_url);
    console.log(data);
    var yesterday = new Date();
    var recovered = 0;
    yesterday.setDate(yesterday.getDate() - 1);
    console.log(moment(yesterday).format("M/D/YY"));
    data.forEach((location,i) => {
        var nb_recovered = location[moment(yesterday).format("M/D/YY")];
        if(typeof nb_recovered !== "undefined" && nb_recovered !== 0)
            recovered += parseInt(location[moment(yesterday).format("M/D/YY")]);
    })
    return recovered;
}

function CSVToArray(csvData, delimiter) {
    delimiter = (delimiter || ",");
    var pattern = new RegExp((
        "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        "([^\"\\" + delimiter + "\\r\\n]*))"), "gi");
    var data = [[]];
    var matches = null;
    while (matches = pattern.exec(csvData)) {
        var matchedDelimiter = matches[1];
        if (matchedDelimiter.length && (matchedDelimiter != delimiter)) {
            data.push([]);
        }
        if (matches[2]) {
            var matchedDelimiter = matches[2].replace(
                new RegExp("\"\"", "g"), "\"");
        } else {
            var matchedDelimiter = matches[3];
        }
        data[data.length - 1].push(matchedDelimiter);
    }
    return (data);
}

function CSVToJSON(csvData) {
    var data = CSVToArray(csvData);
    var objData = [];
    for (var i = 1; i < data.length; i++) {
        objData[i - 1] = {};
        for (var k = 0; k < data[0].length && k < data[i].length; k++) {
            var key = data[0][k];
            objData[i - 1][key] = data[i][k]
        }
    }
    var jsonData = JSON.stringify(objData);
    jsonData = jsonData.replace(/},/g, "},\r\n");
    return jsonData;
}

function updateMap(url, map) {
    echarts.dispose(map);
    var chart = echarts.init(map);
    chart.showLoading();
    $.get(url, (data) => {
        let date = debut_date;
        let dataJson = CSVToJSON(data);
        chart.hideLoading();
        var lines = data.split('\n');
        var res = [];
        JSON.parse(dataJson).forEach( local => {
            let i = 0 ;
            while(date <= date_now) {
                let value = [local.Long, local.Lat, local[moment(date).format("M/D/YY")], local["Province/State"] + ' ' + local["Country/Region"]];
                if(res[i])
                    res[i].push(value);
                else
                    res[i] = [value];
                date.setDate(date.getDate() + 1);
                i++;
            }
            date = new Date("1/22/2020");
        });
        var options = res.map( (day) => {
            return {
                series: {
                    data: day
                }
            };
        })

        chart.setOption({
            timeline: {
                axisType: 'category',
                data: lines[0].split(',').slice(4),
                autoPlay: true,
                playInterval: 600,
                symbolSize: 5,
                tooltip: {
                    formatter: (params) => {
                        return params.name;
                    }
                },
                itemStyle: {
                    color: '#ccc'
                },
                lineStyle: {
                    color: '#eee',
                    width: 4,
                },
                label: {
                    color: '#999'
                },
                checkpointStyle: {
                    color: 'black',
                    borderColor: '#999'
                },
                controlStyle: {
                    borderColor: '#bbb'
                }
            },
            options: options
        })
    });

    chart.setOption({
        baseOption: {
            title: {
                text: "Propagation du Covid-19",
                left: 'center',
                top: 20,
                textStyle: {
                    color: '#000',
                    fontSize: 25
                }
            },
            tooltip: {
                show: true,
                formatter:  (params) => {
                    if(url == confirmed_url)
                        var mode = "confirmés";
                    if(url == deaths_url)
                        var mode = "morts";
                    if(url == recovered_url)
                        var mode = "guéris";
                    return `${params.value[3]} : ${numeral(params.value[2]).format('0,0')} ${mode}`;
                }
            },
            series: [{
                type: 'scatter',
                animation: false,
                coordinateSystem: 'leaflet',
                data: [],
                symbolSize: (value) => {
                    return value[2] > 0 ? Math.log(value[2]) * 3 : 0;
                },
                itemStyle: {
                    color: 'red',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                }
            }],
            visualMap: {
                type: 'continuous',
                min: 0,
                max: 300,
                inRange: {
                    color: ['orange','red'],
                    opacity: [0.3, 0.7]
                },
                dimension: 2
            },
            leaflet: {
                center: [0, 40],
                roam: false
            }
        }
    });
}



function getDataNow() {
    //appel ajax
    var headers = new Headers();
    var dataUrl = $.ajax({
        url: "https://coronavirus-tracker-api.herokuapp.com/v2/locations",
        dataType: "json",
        async: false
    }).responseText;
    //transformation en json
    var jsonData = JSON.parse(dataUrl);
    //initialisation variables
    var data = {};
    data.latest = jsonData.latest;
    data.locations = [];
    var lastCountry = "";
    jsonData.locations.forEach(location => {
        //initialisation des variables de location
        let confirmed = location.latest.confirmed;
        let deaths= location.latest.deaths;
        let recovered = location.latest.recovered;
        let country  = location.country;
        let population = location.country_population;
        //si nouveau pays
        if(country != lastCountry) {
            data.locations.push({
                "country": country,
                "population" : population,
                "confirmed" : confirmed,
                "recovered" : recovered,
                "deaths" : deaths
            });
            //changement dernier pays
            lastCountry = country;
        }
        else{
            //récupération country déjà présent et je l'enlève de la list
            let countryData = data.locations.pop();
            //je la remplace par la nouvelle valeur
            data.locations.push({
                "country": country,
                "population" : population,
                "confirmed" : countryData.confirmed + confirmed,
                "deaths" : countryData.deaths + deaths,
                "recovered" : countryData.recovered = recovered
            });
        }
    });
    return data;
}


function drawPieChart(pie) {
    var chart = echarts.init(pie);
    var data = getDataNow();
    var option = {
        backgroundColor: '#2c343c',

        title: {
            text: 'Proportion des cas dans le monde',
            left: 'center',
            top: 20,
            textStyle: {
                color: '#ccc',
                fontSize: 25
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                return `${params.name} : ${numeral(params.value).format('0,0')} (${params.percent}%)`;
            }
        },
        series: [
            {
                name: 'Proportion des cas',
                type: 'pie',
                radius: '55%',
                center: ['50%', '50%'],
                data: [
                    {value: data.latest.confirmed, name: 'Confirmés'},
                    {value: data.latest.deaths, name: 'Morts'},
                    {value: getRecoveredNow(), name: 'Guéris'}
                ].sort((a, b) => { return a.value - b.value; }),
                label: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    formatter : '{b} : {d}%'
                },
                labelLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    },
                    smooth: 0.2,
                    length: 10,
                    length2: 20
                },
                itemStyle: {
                    color: '#c23531',
                    shadowBlur: 200,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },

                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: function (idx) {
                    return Math.random() * 200;
                }
            }
        ]
    };
    chart.setOption(option);
}

function selectCountries() {
    var select = document.getElementById('countries');
    var data = getDataNow();
    data.locations.forEach((location) => {
        var option = document.createElement('option');
        option.value = location.country;
        option.innerText = location.country;
        select.appendChild(option);
    })
    select.value="France";
}

function getCountryFromData(country) {
    return getDataNow().locations.find((data) => data.country == country);
}

function drawPieChartCountries(pie, country) {
    var chart = echarts.init(pie);
    var dataCountry = getCountryFromData(country);
    var option = {
        backgroundColor: '#2c343c',

        title: {
            text: 'Proportion des cas dans le pays : ' + dataCountry.country,
            left: 'center',
            top: 20,
            textStyle: {
                color: '#ccc',
                fontSize : 25
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                return `${params.name} : ${numeral(params.value).format('0,0')} (${params.percent}%)`;
            }
        },
        series: [
            {
                name: 'Proportion des cas',
                type: 'pie',
                radius: '55%',
                center: ['50%', '50%'],
                data: [
                    {value: dataCountry.confirmed, name: 'Confirmés'},
                    {value: dataCountry.deaths, name: 'Morts'},
                    {value: dataCountry.recovered, name: 'Guéris'}
                ].sort((a, b) => { return a.value - b.value; }),
                label: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    formatter : '{b} : {d}%'
                },
                labelLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.3)'
                    },
                    smooth: 0.2,
                    length: 10,
                    length2: 20
                },
                itemStyle: {
                    color: '#c23531',
                    shadowBlur: 200,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },

                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDelay: function (idx) {
                    return Math.random() * 200;
                }
            }
        ]
    };
    chart.setOption(option);
}

function getDataGlobal(confirmed,deaths,recovered,pourcentage){
    var data = getDataNow();
    var population = 0;
    var nb_recovered = getRecoveredNow();
    data.locations.forEach(location => {
        population+=location.population;
    })
    confirmed.innerHTML = numeral(data.latest.confirmed).format('0,0');
    deaths.innerHTML = numeral(data.latest.deaths).format('0,0');
    recovered.innerHTML = numeral(nb_recovered).format('0,0');
    pourcentage.innerHTML = `${numeral(100 * ((data.latest.confirmed+data.latest.deaths+nb_recovered) / population)).format("0.00")} %`


}





window.addEventListener('load', () => {
    //init var
    var confirmed_button = document.getElementById("btn_confirmed");
    var deaths_button = document.getElementById("btn_deaths");
    var recovered_button = document.getElementById("btn_recovered");
    var map = document.getElementById('map');
    var pie = document.getElementById('globalPieChart');
    var confirmed = document.getElementById('confirmed');
    var deaths = document.getElementById('deaths');
    var recovered = document.getElementById('recovered');
    var pourcentage = document.getElementById('pourcentage');
    var pieCountries = document.getElementById('piechartCountries');
    var selectPieCountries = document.getElementById('countries');
    var selectMapEvolution = document.getElementById('selectMapEvolution');
    //init charts
    updateMap(confirmed_url,map);
    drawPieChart(pie);
    selectCountries();
    drawPieChartCountries(pieCountries, selectPieCountries.value);
    getDataGlobal(confirmed,deaths,recovered,pourcentage);
    //events
    selectPieCountries.onchange = () => { drawPieChartCountries(pieCountries, selectPieCountries.value)};
    confirmed_button.onclick = () => { updateMap(confirmed_url,map) }
    deaths_button.onclick = () => { updateMap(deaths_url,map) }
    recovered_button.onclick = () => { updateMap(recovered_url,map) }
})

// code Romain test

/*function getDaysFromDate(startingDate){
	var date = startingDate;
	var record = [startingDate.toLocaleDateString()];
	
	while(date !== date_now){
		var theDayAfter = new Date(date);
		
		theDayAfter.setDate(theDayAfter.getDate()+1);
		
		record.push(theDayAfter.toLocaleDateString());
		
		date = theDayAfter;
	}
	
	return record;
}*/

function getConfirmedCasesPerCountry(country_code="",
									 province="",
									 county="",
									 source="jhu",
									 timelines=false){

	var queryUrl = "https://coronavirus-tracker-api.herokuapp.com/v2/locations?source="+source+"&timelines="+timelines;

	if(country_code !== "") { queryUrl += ("&country_code="+country_code) };
	if(province !== "") { queryUrl += ("&province="+province) };
	if(county !== "") { queryUrl += ("&county="+county) };

	var dataUrl = $.ajax({
		url: queryUrl,
		dataType: "json",
		async: false
	}).responseText;

	var jsonData = JSON.parse(dataUrl);

	var values = {};

	for(i = 0; i < jsonData.locations.length; i++) {

	    var country = jsonData.locations[i].country;

        if (timelines) {
            var timelineConfirmed = jsonData.locations[i].timelines.confirmed.timeline; // [stamp: nb]
            var timelineDeaths = jsonData.locations[i].timelines.deaths.timeline; // [stamp: nb]
        }

        if (country in values) {
            values[country][0] += jsonData.locations[i].latest.confirmed;
            values[country][1] += jsonData.locations[i].latest.deaths;

            if (timelines) {

                var currentCountryTimeline = values[country][2];

                for (stamp in currentCountryTimeline) {
                    currentCountryTimeline[stamp]["confirmed"] += timelineConfirmed[stamp];
                    currentCountryTimeline[stamp]["deaths"] += timelineDeaths[stamp];
                }
            }

        } else {
            values[country] = [
                jsonData.locations[i].latest.confirmed,
                jsonData.locations[i].latest.deaths
            ];

            if (timelines) {
                var countryTimeline = {};

                for(datetime in timelineConfirmed){

                    countryTimeline[datetime] = {};

                    countryTimeline[datetime]["confirmed"] = timelineConfirmed[datetime];
                    countryTimeline[datetime]["deaths"] = timelineDeaths[datetime];
                }

                values[country] = [
                    jsonData.locations[i].latest.confirmed,
                    jsonData.locations[i].latest.deaths,
                    countryTimeline
                ]
            }
        }
    }

	return values;
}

function getNCountriesWithMostCases(countryCases, n){
	// renvoie les n pays avec les plus grands nombres de cas

	var countries = {...countryCases};

	var results = [];

	while(n != 0){

		let max = 0;
		let maxCountry = "";

		for(country in countries){
			if(countries[country][0] > max) {
				max = countries[country][0];
				maxCountry = country;
			}
		}

		results.push(maxCountry);

		delete countries[maxCountry];

		n = n-1;
	}

	return results;

}

function buildCurvesChart(nbCountriesShowed=6, dataShowed="confirmed") {
	// à voir pour faire une fonction qui récup toutes les dates depuis le 01/22
	var dom = document.getElementById("curves");
	var myChart = echarts.init(dom);

	var valuesPerCountry = getConfirmedCasesPerCountry(country_code="",
		province="",
		county="",
		source="jhu",
		timelines=true);
		
	var mostHitCountries = getNCountriesWithMostCases(valuesPerCountry, nbCountriesShowed);

	var confirmed = {};
	var deaths = {};
	var dates = [];
    var series = [];
    var data;

    switch(dataShowed){
        default:
            console.log("Oops");
            break;
        case "confirmed":
            data = confirmed;
            break;
        case "deaths":
            data = deaths;
            break
    }

	for(i = 0; i < mostHitCountries.length; i++){
	    var country = mostHitCountries[i];

		var countryTimeline = valuesPerCountry[country][2];

		confirmed[country] = [];
		deaths[country] = [];

		for(entry in countryTimeline){
		    var confirmedNumber = countryTimeline[entry]["confirmed"];
            var deathsNumber = countryTimeline[entry]["deaths"];

            confirmed[country].push(confirmedNumber);
            deaths[country].push(deathsNumber);
        }

        var seriesEntry = {
            name: country,
            type: 'line',
            data: data[country],
        };

        series.push(seriesEntry);

	}

	// construction de la liste des dates
    var sample = valuesPerCountry[country][2];

	for(date in sample){
	    dates.push(date);
    }

	option = {
		title: {
			text: 'Courbes'
		},
		tooltip: {
			trigger: 'axis'
		},
		legend: {
			data: mostHitCountries
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		toolbox: {
			feature: {
				saveAsImage: {}
			}
		},
		xAxis: {
			type: 'category',
			boundaryGap: false,
			data: dates.map((date) => {return moment(date).format("M/D/YY")}),
		},
		yAxis: {
			type: 'value'
		},
		series: series
	};

	if (option && typeof option === "object") {
		myChart.setOption(option, true);
	}

}

function buildBarChartCases(nbCountriesShowed=5, dataShowed="nbConfirmedCases") {

	var dom = document.getElementById("barchart");
	var myChart = echarts.init(dom);
	
	var valuesPerCountry = getConfirmedCasesPerCountry();

	var mostHitCountries = getNCountriesWithMostCases(valuesPerCountry, nbCountriesShowed);

	var countries = [];
	var infections = [];
	var deaths = [];
	var ratios = [];

	for (i = 0; i < mostHitCountries.length; i++) {

		let country = mostHitCountries[i];
		let infection = valuesPerCountry[country][0];
		let death = valuesPerCountry[country][1];
		let ratio = ((death/infection) * 100);

		countries.push(country);
		infections.push(infection);
		deaths.push(death);
		ratios.push(ratio);
	}

	var series = [];

	switch(dataShowed){
		default:
			console.log("Problemo gringo");
		case "deathRatio":
			var displayText = "Rapport décès/cas confirmés";
			var displayData = ["Ratio"];
			series = [
				{
					name: 'Rapport',
					type: 'bar',
					data: ratios
				}
			];
			break;
		case "nbConfirmedCases":
			var displayText = "Cas confirmés";
			var displayData = ['Infections', 'Décès'];
			series = [
				{
					name: 'Infections',
					type: 'bar',
					data: infections
				},
				{
					name: 'Décès',
					type: 'bar',
					data: deaths
				}
			];
			break;
	}

	option = {
		title: {
			text: displayText,
		},
		tooltip: {
			trigger: 'axis',
			axisPointer: {
				type: 'shadow'
			}
		},
		legend: {
			data: displayData
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '3%',
			containLabel: true
		},
		xAxis: {
			type: 'value',
			boundaryGap: [0, 0.01]
		},
		yAxis: {
			type: 'category',
			data: countries
		},
		series: series
	};

	if (option && typeof option === "object") {
		myChart.setOption(option, true);
	}
}

$(document).ready(function() {
	buildBarChartCases();
	buildCurvesChart();

	var selectNbBC = document.getElementById("nbVisibleCountriesBarChart");
	var selectDataBC = document.getElementById("dataShowedBarChart");

	//var selectNbLC = document.getElementById("nbVisibleCountriesLineChart");
	var selectDataLC = document.getElementById("dataShowedLineChart");

	/*selectNbLC.onchange = () => {
		var intNb = parseInt(selectNbLC.value);
		buildCurvesChart(intNb, selectDataLC.value);
	}*/

	selectNbBC.onchange = () => {
		var intNb = parseInt(selectNbBC.value);
		buildBarChartCases(intNb, selectDataBC.value);
	}

	selectDataBC.onchange = () => {
		var intNb = parseInt(selectNbBC.value);
		buildBarChartCases(intNb, selectDataBC.value);
	}

    selectDataLC.onchange = () => {
        buildCurvesChart(6, selectDataLC.value);
    }

});