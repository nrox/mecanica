//------ some auxiliary functions to display results and define goal
var goal;

function resetGoal(){
    goal = {x: Math.random(), y: Math.random()};
}

function displayGoal(){
    var res = '';
    res += "goal:";
    res += "<br />";
    res += 'x:' + goal.x;
    res += "<br />";
    res += 'y:' + goal.y;
    $('#goal').html(res);
}

function displayResults(clearResults){
    if (clearResults){
        $('#result').html("");
        return;
    }
    var status = ga.status();
    var res = '';
    res += "results:";
    res += "<br />";
    res += 'x:' + status.best.x;
    res += "<br />";
    res += 'y:' + status.best.y;
    res += "<br />";
    res += "<br />";
    res += "fitness: " + status.fitness + "<br />";
    res += "achieved: " + status.achieved + "<br />";
    res += "steps: " + status.steps + "<br />";
    res += "size: " + ga.size + "<br />";
    $('#result').html(res);
}

resetGoal();
displayGoal();

//----- now the juice

var ga = new Genetic({
    size: 100,
    steps: 1000,
    fitness:  function(c){
        return Math.sqrt(Math.pow(goal.x-c.x,2) + Math.pow(goal.y-c.y,2));
    },
    criteria: function (){
        return this.bestFitness()<0.001;
    }
});

ga.add(new Feature({
    name: 'x',
    random: function(){
        return Math.random();
    },
    mutate: function (x){
        return x * (1 + 0.1 * (0.5-Math.random()));
    }
}));

ga.add(new Feature({
    name: 'y',
    random: function(){
        return Math.random();
    },
    mutate: function (x){
        return x * (1 + 0.1 * (0.5-Math.random()));
    }
}));

ga.createPopulation();
ga.solve();

//-------

displayResults();

