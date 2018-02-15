$(document).ready(function() {
  function toggleModal(){
    var modal = document.getElementById("board-modal");
    modal.classList.toggle("is-active");
  }

  $("#burger").click(function(e) {
    var burger = document.getElementById("burger");
    var menu = document.getElementById("menu");
    burger.classList.toggle("is-active");
    menu.classList.toggle("is-active");    
  });

  $("#customize-button").click(toggleModal);

  $("#save-boards").click(toggleModal);

  $("#close-modal").click(toggleModal);

  numCalls = 0;
  completedCalls = 0;
  allResults = [];

  function linkStrings(divider){
    return function(a,b){ return a.concat(divider + b); };
  }

  function printResults(){
    var result = "";
    for(var i = 0; i < allResults.length; ++i){
      for(var j = 0; j < allResults[i].length; ++j){
        result += "<div class='box'>";
        result += "<article class='media'>";
        result += "<div class='media-content'>";
        result += "<p><strong>" + allResults[i][j].title +"</strong><br>";
        result += "Organization: " + allResults[i][j].organization + "<br>";
        result += "Location: " + allResults[i][j].location + "<br>";
        result += "<a href='" + allResults[i][j].link + "'>Link to Post</a><br>";
        result += "Source: " + allResults[i][j].source;
        result += "</p>";
        result += "</div>";
        result += "</article>";
        result += "</div>";
      }
    }
    $("#searchResults").html(result);
    numCalls = 0;
    completedCalls = 0;
    allResults = [];
  }

  function handleError(error){
    console.log('Error: ' + JSON.stringify(error,null,2));
    ++completedCalls;
    if(completedCalls >= numCalls) printResults();
  }

  function stripHtml(string){
    var tmp = document.createElement("div");
    tmp.innerHTML = string;
    return tmp.textContext || tmp.innerText || "";
  }

  function searchAdzuna(keywords, location){
    var appId = '8a3d5455';
    var appKey = '42b0a8c582284eb8e69d793198ec1c39';
    var numResults = '20';
    var url = 'http://api.adzuna.com/v1/api/jobs/us/search/1?app_id=' + appId + '&app_key=' + appKey + '&results_per_page=' + numResults + '&what=' + keywords.reduce(linkStrings('%20')) + '&where=' + location.reduce(linkStrings('%20')) + '&content-type=application/json';
    $.ajax({
      url: url,
      dataType: "json",
      success: function(json){
        var results = [];
        for(var i = 0; i < json.results.length; ++i){
          results.push({ 
            title: stripHtml(json.results[i].title),
            organization: json.results[i].company.display_name,
            location: json.results[i].location.display_name,
            link: json.results[i].redirect_url,
            source: 'Adzuna'
          });
        }
        allResults.push(results);

        ++completedCalls;
        if(completedCalls >= numCalls) printResults();
      },
      error: handleError
    });
  }

  function searchSearch(keywords, location){
    var url = 'https://jobs.search.gov/jobs/search.json?query=' + keywords.reduce(linkStrings('+'));
    if(location.length > 0){
      url += '+in+' + location.reduce(linkStrings('+'));
    }
    $.ajax({
      url: url,
      dataType: "json",
      success: function(json){
        var results = [];
        for(var i = 0; i < json.length; ++i){
          results.push({ 
            title: json[i].position_title,
            organization: json[i].organization_name,
            location: json[i].locations[0],
            link: json[i].url,
            source: 'Search.gov'
          });
        }
        allResults.push(results);

        ++completedCalls;
        if(completedCalls >= numCalls) printResults();
      },
      error: handleError
    });
  }

  searchMap = {
    adzuna: searchAdzuna,
    search: searchSearch,
  };

  $("#search-jobs").click(function(e) {
    e.preventDefault();
    var keywords = $("#keywords").val().trim().split(" ");
    var location = $("#location").val().trim().split(" ");
    var boards = ["adzuna", "search"];
    var ajaxCalls = [];
    for(var i = 0; i < boards.length; ++i){
      var checked = $("#" + boards[i]).is(":checked");
      if(checked){
        ajaxCalls.push(boards[i]);
      }
    }
    numCalls = ajaxCalls.length;
    completedCalls = 0;
    for(var i = 0; i < ajaxCalls.length; ++i){
      searchMap[ajaxCalls[i]](keywords, location);
    }
  });

});
