// --------- initialization function ----------
function init() {
  // 
  const selector = d3.select('#selDataset');

  d3.json("samples.json").then((jsonData) => {

    const sampleNames = jsonData.names;

    console.log(sampleNames);

    sampleNames.forEach(item => {
      selector.append('option')
      .text(item)
    });

  // print the meta data  
  printMetadata(sampleNames[0]);

  const alldata940 = jsonData.samples[0];
  console.log(alldata940)

  // build the initial bar and bubble plot for selected
  barPlotSelected(sampleNames[0]);
  
  //build the initial bar plot for all samples (aggregated)
  barPlot_AllSamples();
  
  bubbleChart(sampleNames[0]);
})  
};

// -------- function to print the metadata ---------
function printMetadata(sample){

  const metaPanel = d3.select("#sample-metadata");

  d3.json("samples.json").then(data => {

    const metadata = data.metadata;

    var sampleMetaData = metadata.filter(item => item.id == sample);

    console.log(sampleMetaData)
    const sampleData = sampleMetaData[0];
    
    metaPanel.html("");

    Object.entries(sampleData).forEach(([key, value]) => {
      metaPanel.append('p')
      .text(`${key}:${value}`)
    });
  });
};

//--------- function for selection event ------------
function optionChanged(sample){
  printMetadata(sample);
  barPlotSelected(sample);
  bubbleChart(sample);
};

//-----------------------------------------------------------
// d3.selectAll("#sample-metadata").on('change', printMetadata);

// ------------- bar plot for the selected sample ------------------
function barPlotSelected(sample) {

  d3.json("samples.json").then(data => {

    // all samples
    const samples = data.samples;

    // selected sample data
    const sample_data = samples.filter(item => item.id == sample);
    console.log(sample_data[0]);

    // sample id, values, otu id, otu labels of the selected sample
    const sample_id = sample_data[0].id;
    const sample_values = sample_data[0].sample_values;
    const sample_otu_ids = sample_data[0].otu_ids;
    const sample_otu_labels = sample_data[0].otu_labels;
    console.log(sample_otu_labels)

    // split the loooooooooong otu labels
    let cleanArrLabels = sample_otu_labels.map((item, i) => {

      let otu_ids = sample_otu_ids[i];

      return (`${otu_ids}: ${item.split(";").slice(-1)[0]}`);
    });
    console.log(cleanArrLabels)

    // extract the sample values
    var cleanArrValues = sample_values.map((item, i) => {
      var otu_values = sample_values[i];
      return item;
    });

    // now lets start plotting
    const title = `Sample id - ${sample_id}`;
    const trace = {
      x: cleanArrValues.slice(0, 10).reverse(),
      y: cleanArrLabels.slice(0, 10).reverse(),
      type: 'bar',
      orientation: 'h',
      title: title,
      text: cleanArrLabels.reverse()
    };
    var data = [trace];
    var layout = {
      title: title,
      xaxis: { title: "Sample values" },
      yaxis: cleanArrLabels,
      width: 600,
      margin: {
        l: 200,
        r: 50,
        b: 50,
        t: 50,
        pad: 10}
    };
    Plotly.newPlot("bar2", data, layout);
  })

};

// -------------function to do bar plot for all samples ----------------------

//Aggregation across samples to create the all samples bar plot

// 1. Loop through all the samples to parse the sample lables;

// 2: split by semi-colon, and extract the otu_id for each sample

// 3: sum up the otu_id across samples

function barPlot_AllSamples() {

  otu_ids_list = [];
  otu_genus = "";
  values = "";
  id_combo ="";

  d3.json("samples.json").then(data => {

    const samples = data.samples;

    // extract the otu_ids from the 'samples'
    var otu_ids = samples.map(item => item.otu_ids);
    
    // push the otu_ids to the array otu_ids_list
    otu_ids_list.push(otu_ids);

    // output is an array of arrays
    console.log(otu_ids_list);
    
    otu_labels_list = [];
    otu_labels_arr = [];
    values_list = [];
    
    // unpack the itu_ids and save them in an array
    var new_ids_arr = unpack(otu_ids_list);
    otu_ids_list = new_ids_arr;
    console.log(otu_ids_list);

    // do the same for sample values
    var sample_values = samples.map(item => item.sample_values);
    values_list.push(sample_values);
    console.log(values_list);

    var new_values_arr = unpack(values_list);
    values = new_values_arr;
    console.log(values);

    // do the same to otu labels
    var otu_labels = samples.map(item => item.otu_labels);
    // console.log(otu_labels);

    otu_labels.forEach((item, i) => {
      
      let genus_list = [];

      for (var i=0; i<item.length; i++) {
        
        var item_genus = item[i].split(";").slice(-1);
        
        genus_list.push(item_genus);

      }
      
      var new_lables_list = unpack(genus_list);
      
      otu_labels_list.push(new_lables_list);

      var new_labels_arr = unpack(new_lables_list);

      // console.log(new_labels_arr);
      otu_labels_arr.push(new_labels_arr);
      // console.log(otu_labels_arr);
    });
    var otu_genus = unpack(otu_labels_arr);
    console.log(otu_genus)

    // now combine the otu ids and otu labels to form the new plot label
    allSamples = [];
    id_lbl = [];
    for (var i=0; i<otu_ids_list.length; i++) {
      let id = otu_ids_list[i];
      let lbl = otu_genus[i];
      let value = values[i];
      let id_lbl = `${id}: ${lbl}`;
      allSamples.push({id:id, lbl: lbl, id_lbl:id_lbl, value: value});
      };

    console.log(allSamples);

    // aggregation on the same otu
    agg_temp = {};

    allSamples.forEach((item) => {
      if (agg_temp.hasOwnProperty(item.id_lbl)) {
        agg_temp[item.id_lbl] += item.value;}
      else {
        agg_temp[item.id_lbl] = item.value;}
      });
    console.log(agg_temp);
 
    otu_list = [];
    value_list = [];
    objectFinal = [];

    let unsortedArrAgg = Object.entries(agg_temp).forEach((key, value) => {
      let otu_id = key[0];
      let samplevalue = key[1];
      otu_list.push(otu_id);
      value_list.push(samplevalue);
    });

    for (var i=0; i<value_list.length; i++) {

      let id = otu_list[i];
      let val = value_list[i];
      objectFinal.push({id:id, value: val});
      };


    // sort the aggregated object by the values
    const sortedFinal = objectFinal.sort(function(a, b) {
      return b.value - a.value;
    });
    console.log(sortedFinal);
    const arrayX = sortedFinal.map(item => item.value);
    const arrayY = sortedFinal.map(item => item.id);

    // start plotting
    title = 'Top 10 Bacteria - all samples';
    const trace = {
      y: arrayY.slice(0, 10).reverse(),
      x: arrayX.slice(0, 10).reverse(),
      type: 'bar',
      orientation: 'h',
      title: title,
      text: id_lbl.reverse()
    };
    var data = [trace];
    var layout = {
      title: title,
      xaxis: { title: "Sample values" },
      // yaxis: cleanArrLabels,
      width: 600,
      margin: {
        l: 150,
        r: 50,
        b: 50,
        t: 50,
        pad: 10}
    };
    Plotly.newPlot("bar1", data, layout);


// ------ a simple function to unpack/flatten an array of arrays into one array
function unpack( array, newarray ){
  if( !newarray ) newarray = [] ;
  if( array ) for( var i = 0 ; i < array.length ; ++i )
  {if( array[i].constructor.name === "Array" ) unpack( array[i], newarray ) ;
      else newarray.push( array[i] ) ;}
  return newarray ;
};
})}; 

// ----------- function to plot the bubble chart for selected sample -----
function bubbleChart(sample) {
  d3.json("samples.json").then(data => {
  const samples0 = data.samples;
  // console.log(samples0)
  // selected sample data
  const sample_data1 = samples0.filter(item => item.id == sample);
  // console.log(sample_data1[0]);

  // sample id, values, otu id, otu labels of the selected sample
  const sample_id1 = sample_data1[0].id;
  const sample_values1 = sample_data1[0].sample_values;
  const sample_otu_ids1 = sample_data1[0].otu_ids;
  const sample_otu_labels1 = sample_data1[0].otu_labels;
  // console.log(sample_otu_labels1);

  // split the loooooooooong otu labels
  let FamilyLabels = sample_otu_labels1.map((item, i) => {

    let otu_ids = sample_otu_ids1[i];
    // console.log(item.split(";").length>=5)
    if (item.split(";").length>=5) {
      return (`${otu_ids}: ${item.split(";").slice(0,5)}`);
    }
    else {
      return (`${otu_ids}: ${item.split(";")}`);
    }
  });
  console.log(FamilyLabels);

  // extract the sample values
  var ValuesSel = sample_values1.map((item, i) => {
    var otu_values = sample_values1[i];
    return item;
  });
  console.log(ValuesSel);

  //Find unique families
  function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
  
  var FamilyTag = FamilyLabels.filter( onlyUnique );
  console.log(FamilyTag);
  
  // now combine the FamilyTag & Values to get an object
  Family_Value_all = [];
  for (var i=0; i<FamilyLabels.length; i++) {
    let tag = FamilyLabels[i];
    let val = ValuesSel[i];
    Family_Value_all.push({ familyTag: tag, value: val});
    };

  console.log(Family_Value_all);


  FamilyAgg = [];
  FamilyAggObj=[];
  for (var i=0; i < FamilyTag.length; i++) {
    // console.log(unique_families[i]);
    const filtered_family_data = Family_Value_all.filter(item => item.familyTag == FamilyTag[i]);
    // sum_value = item.value;
    console.log(filtered_family_data);
    total_value = 0;
    filtered_family_data.forEach(item => {
      total_value += item.value;
    })
    FamilyAgg.push(total_value);
    FamilyAggObj.push({tag:FamilyTag[i], value:FamilyAgg[i]});

  }
  console.log(FamilyAgg);

  // sort the aggregated object by the values
    const sortedFamilyAggObj = FamilyAggObj.sort(function(a, b) {
      return b.value - a.value;
    });
    console.log(sortedFamilyAggObj);

    let valuesX = sortedFamilyAggObj.map(item => item.value);
    let familyY = sortedFamilyAggObj.map(item => item.tag);
    console.log(valuesX);
    console.log(familyY);
    console.log(Array.from({length: 10}, (_, index) => index + 1))
    console.log(valuesX.slice(0, 10))
    sizefactor = valuesX.slice(0, 10).map(x => x*0.2)
    console.log(sizefactor)
    // start plotting
    title = 'Top 10 Family - Selected Sample';
    const trace = {
      // y: Array.from({length: 10}, (_, index) => index + 1),
      y: familyY.slice(0, 10),
      x: valuesX.slice(0, 10),
      mode: 'markers',
      marker:{
        size:sizefactor
      }
    };
    var data = [trace];
    var layout = {
      title: title,
      xaxis: { title: "Sample values" },
      // yaxis: 
      width: 1000,
      margin: {
        l: 450,
        r: 50,
        b: 75,
        t: 75,
        pad: 10},
      font: {
          family:"Arial, monospace",
          size:10,
          color:"black"
      }
    };
    Plotly.newPlot("bubble", data, layout);


})};
// })};

init();