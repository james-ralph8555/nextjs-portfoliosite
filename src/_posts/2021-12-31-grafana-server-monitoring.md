---
title: Setting up Grafana with InfluxDB for Server Monitoring
date: 2021-12-31
coverImage: "/grafana-monitoring-post/setup-influxdb.webp"
---

Grafana is an exceptional tool for status monitoring and alerting, with flexibility and extensibility that is hard to find in other tools. This guide will cover every step of the process, from installation to a usable dashboard. The DIY setup of Grafana is a plus in my mind, since once you set it up, you will understand every metric you have shown. You can have a basic setup with a few key metrics and alerts, or you can tinker it to your heart’s content. Fair warning: this setup will take a few hours, but you do not need to do every example in the examples section to have a working dashboard.

![My Grafana Dashboard](/grafana-post/1_Y9zMs-69y5VhPg7OwNWdGg.webp)
*My Grafana Dashboard*

## The Stack

For this article, I will use a stack consisting of influxDB v2 with telegraf and grafana on a linux system. These will be deployed via Docker containers. InfluxDB is a time series database that holds all of your metrics. Version 2 comes with a great web interface that makes querying data easy, even if you have no prior database experience. Telegraf is a tool built into influxDB which grabs a wide range of system info, such as system resource usage and docker stats.

## Docker

Docker will be used for this guide. If you do not have docker, instructions to install it can be found [here](https://docs.docker.com/engine/install/). If anything goes wrong during the installation of influxDB or grafana during this guide, you can see error messages with

```
docker logs influxdb
```

or

```
docker logs grafana
```

## InfluxDB

We will want to use influxDB 2 here, since it is the newest version. The following docker command starts an influxDB container, and persists the data in the directory labeled `<influxDB-dir>`. Change that part of the code to whatever directory you want influxDB’s data to reside.

```
docker run -d \
    --name=influxdb \
    -p 8086:8086 \
    -v "<influxDB-dir>/data":/var/lib/influxdb2 \
    -v "<influxDB-dir>/config":/etc/influxdb2 \
    --restart=unless-stopped \
    influxdb:2.1.1
```

If all went well, you should be able to navigate to [http://localhost:8086](http://localhost:8086) or http://<server-ip-addr>:8086 and see the influxDB configuration screen:

![InfluxDB config screen](/grafana-post/1_Wl2s0DEcEudL4dAzAb0adg.webp)

Press Get Started, and create a user, password, organization name, and an initial bucket name. A good choice for your organization name is your system’s hostname, and you should name your start bucket “telegraf-bucket”. Once that is setup you should see this screen:

![InfluxDB main screen](/grafana-post/1_mnq4KA2PmCfjo7-qnCJIxg.webp)

Select “Load your data”, and then navigate to the telegraf tab.

## Telegraf

Once you are on the telegraf screen, click “create configuration”. You should see options, and I selected “System” and “Docker”:

![Telegraf config options](/grafana-post/1_LNBhNr-bThlpTkP3VErJfA.webp)

You can select the other services as well if you run these.

Once you click “continue”, you can give your configuration a name. On the left pane, you will notice Docker has a grey circle next to it. Click on the docker tab and enter

```
unix:///var/run/docker.sock
```

As the docker endpoint.

Once you create your telegraf configuration, you will have to install telegraf. I am going to break my own rules here and install telegraf on the system rather than as a docker container. There is less configuration required this way, but either way will work for the purposes of this guide. Instructions for installing telegraf can be found [here](https://portal.influxdata.com/downloads/).

Next, copy the telegraf api token to the clipboard and enter it in your system. Then, start telegraf. Make sure the user you are running it as has permissions to access the resources you specified. I also add a “&” to the end of the telegraf command to run it in the background, like so

```
telegraf --config <url> &
```

The startup message should alert you to any errors in starting telegraf (likely permissions problems — I run this as root). If all went well, you should be able to hit “listen for data” in influxDB and see it report “Connection Found”. You can hit the “explore” tab in influxDB and you should see measurements like cpu and disk being collected.

Note: telegraf can also be configured manually with a configuration file. To see how that is done, see [this guide](https://docs.influxdata.com/influxdb/v2.1/write-data/no-code/use-telegraf/manual-config/)

## Grafana

Similarly to influxDB, we start grafana with the following command:

```
docker run -d \
    --name=grafana \
    -p 3000:3000 \
    -v "<grafana-dir>":/var/lib/grafana \
    grafana/grafana
```

You will also have to set proper permissions for “<grafana-dir>” with

```
chown 472:0 <grafana-dir> -R
```

Go to http://<ip-addr>:3000 and you should be presented with the login screen. The default login is

```
username: admin
password: admin
```

You should be presented with a screen to change your password after logging in.

You should now see the grafana start screen:

![Grafana start screen](/grafana-post/1_k0VQXTbwrObepbcFI4UaxQ.webp)

Select the gear icon on the left pane and then go to data sources, and select “Add a data source”, and select “InfluxDB”

## Data Source Configuration

Go back to the influxDB page at http://<ip-addr>:8086, select the data tab, and then select “API Tokens”. Create a token with read permissions for your telegraf bucket.

Back to grafana, you should see a screen like this:

![Grafana Data Source Config](/grafana-post/1_KXPlSE_9167oD2luADazgg.webp)
*Grafana Data Source Config*

Make sure to select your query type as “Flux”, since we are using influxDB v2. Enter your influxDB url, organization, API token from the previous section, and bucket name. Make sure your data source saves successfully.

## Usage

Now, the system is ready to go. However, it’s still not very useful, since there is no dashboard yet. Go to the left pane in grafana and press the plus symbol, and then select dashboard.

![Your first dashboard! Not much to look at yet.](/grafana-post/1_-JwuqPh4zpPjc2k5gqX_IA.webp)
*Your first dashboard! Not much to look at yet.*

Select add a new panel. You can paste in this example query and you should see data, assuming you enabled system metrics in telegraf.

```
from(bucket: "telegraf-bucket")
|> range(start: v.timeRangeStart, stop: v.timeRangeStop)
|> filter(fn: (r) => r["_measurement"] == "cpu")
|> filter(fn: (r) => r["_field"] == "usage_system" or r["_field"] == "usage_user")
|> filter(fn: (r) => r["cpu"] == "cpu-total")
|> group(columns: ["_measurement"])
|> aggregateWindow(every: v.windowPeriod, fn: sum, createEmpty: false)
|> yield(name: "sum")
```

This query gives the sum of cpu usage by the system and user across all fields and threads. The nice thing about influxDB is that you don’t have to create these queries by hand. Go the the explore tab of influxDB and create a queries there:

![InfluxDB explore tab](/grafana-post/1_Sm5zDkwAqdbHi7oaBbXt1Q.webp)

Then click on the “script editor” button for the query text. You can then paste this in a grafana panel and get the data.

## Grafana Visualization Types

[The Grafana documentation](https://grafana.com/docs/grafana/latest/visualizations/) gives a good overview of the types of visualizations available. Some visualization types, like bar charts, require transformations in grafana when being used with influxDB, which will be covered in the next section.

## Grafana Transformations

Transformations are essential to building a good looking dashboard, but the range of options is overwhelming at first. I will go over a few examples in the next section of how to use them to make useful graphs. [The Grafana documentation](https://grafana.com/docs/grafana/latest/panels/transformations/) gives a full list for reference.

# Grafana Examples

## Single Stat — 1 Minute System Load

In InfluxDB, navigate to the explore page, and select “system” as the measurement and “load1” as the field.

![System 1 Minute Load Query](/grafana-post/1_dNkrVWmbQrOJIIw1oVUjJg.webp)
*System 1 Minute Load Query*

You can click “submit” to get a time series graph of the 1 minute load, but what we want here is the text from the script editor. Select that text and paste it into a new grafana panel.

![The Query Pasted into Grafana](/grafana-post/1_xp1l8xskiuuggwYFCIOVfA.webp)
*The Query Pasted into Grafana*

A time series is useful if you want to identify periods of high load. **An important thing to understand in grafana is that the time selector on the top right sets the time range for all charts on the dashboard. This is sometimes counter-intuitive. For example, if I have a gauge from a stat that is updated once per day, and I select the time range for the dashboard to 5 minutes, this stat will be blank since there was no new data in the past 5 minutes.** The way to set a custom time range, down to the query level, is to select “query options” and set the relative time to the time range you want, i.e. 1d for the last day.

You can change the graph type, for example to a stat, gauge, or bar gauge (these are simple and function similarly), and then rename the graph title and this graph is finished.

## Multiple Stats — 1, 5, and 15 Minute Load

Similarly to the last example, we start a query in InfluxDB. This time, instead of just selection the “load1” in influxDB, we will select “load1”, “load5”, and “load15”. We also want to select “n_cpus” for reasons that will be shown later.

Like last time, we copy our query into grafana, and get 4 series. Here, I will be using a “gauge” type visualization.

![Gauges for load](/grafana-post/1_QmedZpbfWlztxMpjvOZNhQ.webp)

As you can see, this isn’t very nice. There’s no units, the graphs are out of order, and the labels aren’t the most readable.

Using grafana’s transforms, we can make this into something more usable. Transforms can be found next to “Query” in the grafana panel editor.

First, we want to apply a concatenate fields transform, so we can use an organize fields transform later.

Then, we want to add 3 “add field from calculation transforms”. This allows us to do math on the data returned by queries. System load in linux is given as a number which goes from 0 for no load to n_cpus for max load. We want to have this as a percentage. Therefore, we set the mode of each of these transforms to “binary operation”. We then divide the load by the number of CPUs

![Each Transform Should Look Like This](/grafana-post/1_hYGHkls2TttiNdxNwU9bDA.webp)
*Each Transform Should Look Like This*

Now, we can use an organize fields transform to hide the original data and rename fields.

![Organize fields transform](/grafana-post/1_OvX9FpdVTT_9QtpE6qsXrg.webp)

After this, using the options pane, we can set the unit to “Percent (0.0–1.0)”, the min to 0, the max to 1, and the red threshold to 0.8. The title can be changed too, resulting in

![Final load gauges](/grafana-post/1_ZY5dNhKP0iekTz6MSTwg4w.webp)

## Combining Multiple Queries — CPU and Hard Drive Temperatures

First, CPU temperatures are only available when using the powerstat plugin, and Hard Drive Temperatures are only available when using the SMART plugin. See the “Expanding Telegraf” section of this guide to see how to enable this.

Since we are pulling two different measurements, we will use multiple queries in grafana. The first query will pull the CPU temperature, by core

![InfluxDB Query for Per Core CPU Temperature](/grafana-post/1_0w9jZUh_YrqP0t5UQvbbAQ.webp)
*InfluxDB Query for Per Core CPU Temperature*

This query returns 4 time series, or one for each core.

If we want the mean temperature of all 4 cores, we add a group to our query, group by measurement, and aggregate by mean:

![InfluxDB Query for CPU Temperature](/grafana-post/1_29NjY4gOJp80F3MNndhUFA.webp)
*InfluxDB Query for CPU Temperature*

This aggregates the temperature of the 4 series from before into one. Paste these into grafana and use a bar gauge to display the most recent data.

We now have to use grafana transforms. First, we use a “concatenate fields” transform to merge the results of both queries into a single field. Then, and “organize fields” transform is used to rename and reorder the fields:

![Organize fields](/grafana-post/1_Zsx9AyZFontVscH7LhvGDA.webp)

We can now use the options pane on the right hand side of grafana to change the title, graph style, orientation, font size, units (degrees C in this case) and thresholds. Thresholds change the color of the bar once it is over a certain level. I set the threshold to 80 and the color to red, so the green bar changes to red when a temperature is over 80 degrees. These can also be set per bar using the “overrides” section. This results in

![Temperature gauges](/grafana-post/1_ewpD-RG56pNje3y9I3VqsA.webp)

## Disk Usage — Pie/Donut Chart

First, we start off by querying the disk measurement for the “used” and “free” fields, and filtering this to a single drive.

![Disk usage query](/grafana-post/1_7qvf6dW-XLsjNEnV6mlH1w.webp)

Again, this is pasted into grafana, and the chart type is set to “Pie”. Like the previous example, a concatenate fields and organize fields transform is used to name the series to something more readable. For a pie chart, the style can either be a “pie” or a “donut”, and this is changeable in the options pane. Creating a legend in the options panel and adding the percentage values to it is also something I like to do. This results in

![Disk usage chart](/grafana-post/1_9jqJSRlRJ5ZqeknKMzpIgg.webp)

## Bar Charts From Time Series

For docker, I have a few containers that I like to monitor the CPU and Memory usage of. This can be accomplished in other ways, but I use a bar chart. This requires a couple transforms to make work.

First, we want to query the “usage_percent” field from the “docker_container_cpu” and “docker_container_mem” stats. You may want to filter the query to just a few important containers if you have a lot. Then paste this query into grafana.

We need a few transforms. The first is labels to fields, which takes the container name label from influxDB and makes it into a field.

The next is reduce, using reduce fields mode. This transforms data from a time series to just the last value(or max or mean depending on the calculation you choose).

Then, an outer join is done on container name to connect each container to its cpu and memory usage values.

After this, an organize fields transform is done where the first N/2 entries are labeled “CPU” and the last N/2 entries are labeled “Mem” where N is the number of containers queried.

![Docker usage transforms](/grafana-post/1_BHHAjJi4Vp4HCh2TcDw1Ow.webp)
*Docker usage transforms*

Next, in the options pane, the legend is hidden. The unit is set to percent (0–100). Overrides are performed, by matching with regex. This allows us to match every field labeled “CPU” or “Mem” instead of having to apply the overrides manually. In the overrides, the colors of the bars are changed.

![Override to Change Bar Color](/grafana-post/1__afuazomQBHLO5NoZ_TPXw.webp)
*Override to Change Bar Color*

This results in the CPU and memory usage being grouped nicely by container.

![The Final Result](/grafana-post/1_wXvNdThud28LmF539qJY1g.webp)
*The Final Result*

## Read/Write and Network Usage — Rates From Totals

Linux reports network and disk reads and writes in bytes since the system was started. If you want to get a rate, this can be done in influxDB.

![Network usage query](/grafana-post/1_wJDR4PXL03WZR_BJ-2JCug.webp)

Using the aggregation function “derivative” allows us to see the current rate that data is being sent over the network. Note that a very similar query can be done for disk usage, using “diskio” as the measurement and “write_bytes” and “read_bytes” as the field. This query can be pasted into grafana and the standard options fields can be changed to get the graph you want.

## Expanding Telegraf

As mentioned previously, there are more plugins available for telegraf. Some very useful ones are SMART devices for monitoring hard drive errors and temperature, powerstat for seeing CPU frequency and temperature, and fail2ban for monitoring access. These can be enabled by uncommenting the relevant fields in the telegraf config. [A full guide on how to set this up is given on the influxDB website](https://docs.influxdata.com/influxdb/v2.1/write-data/no-code/use-telegraf/manual-config/).

## Beyond Telegraf

Telegraf is great, but there are some stats that it does not cover. These may be from custom APIs you have, or maybe you want to monitor website uptime.

## Website Uptime, HTTP Status, and Latency

[Blackbox Exporter](https://hub.docker.com/r/prom/blackbox-exporter/) is what I use to monitor my websites. It runs as a docker container, and this is the script I use to start it

```
docker run -d \
-p 9115:9115 \
--name blackbox_exporter \
-v "<blackbox-exporter-dir>":/config \
prom/blackbox-exporter:master --config.file=/config/blackbox.yml
```

It needs a config file, and for the setup here, this can be very simple:

```
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      method: GET
  http_post_2xx:
    prober: http
    http:
      method: POST
```

The config file is saved in <blackbox-exporter-dir>/config

Now, we can query our website at

```
http://<ip-addr>:9115/probe?target=<domain-name>&module=http_2xx
```

This produces a few simple fields, such as HTTP status code and probe_duration_seconds.

Using the link above, we can create a scraper in influxDB. To do this, navigate to the data tab of influxDB and select “scrapers”. Paste in the link above. I create a new bucket for each scraper. You can create another api key that gives read access across all buckets and edit your grafana data source configuration with this API key. Once this is all done, you will see a new bucket with all the fields that blackbox exported. Since influxDB is a time series database, we can use these points in time to chart the state. Query “probe_http_status_code” from influxDB and paste it into grafana. For a website, successful http codes are in the range of 200–299. Therefore, we can use the state diagram or status history chart in grafana and set thresholds to be red for values not in 200–299.

![Uptime chart](/grafana-post/1_ohO5PQVc43Lz7TJr3D5cuA.webp)

Similarly, the probe duration status measurement can be queried from the scraper’s bucket. A stat or time series is a good way to represent this value.

## Custom Bash Scripts with the InfluxDB API

This is perhaps the most tedious but most flexible usage of influxDB and grafana. This gives you the ability to send anything from your server’s CLI to influxDB. For example, for monitoring my google drive usage via the CLI ([using this program](https://github.com/prasmussen/gdrive)), I type the following command and get the following data

```
$gdrive about --bytes
User: user, email@gmail.com
Used: 7271349049 B
Free: 8834778311 B
Total: 16106127360 B
Max upload size: 5242880000000 B
```

Using standard unix commands, I can for example extract the Used and Free fields here with

```
used=$(gdrive about --bytes | head -n 2 | tail -n 1 | awk '{print $2}')
free=$(gdrive about --bytes | head -n 3 | tail -n 1 | awk '{print $2}')
```

These variables are inserted into a curl request with the following bash script.

```bash
#!/bin/bash
influx_db_key="<influxdb-api-key>"
bucket="<bucket-name>"
org="<org-name>"
influx_url="http://<ip-addr>:8086"
used=$(gdrive about --bytes | head -n 2 | tail -n 1 | awk '{print $2}')
free=$(gdrive about --bytes | head -n 3 | tail -n 1 | awk '{print $2}')
curl --request POST \
"$influx_url/api/v2/write?org=$org&bucket=$bucket&precision=s" \
  --header "Authorization: Token $influx_db_key" \
  --header "Content-Type: text/plain; charset=utf-8" \
  --header "Accept: application/json" \
  --data-binary "
    gdrive_status used=$used,free=$free $(date +%s)
    "
```

This script can then be run as a cronjob to continuous send data to influxDB.
