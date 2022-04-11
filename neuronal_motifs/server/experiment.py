import navis
import plotly

x = navis.example_neurons(1)


fig = x.plot3d(backend='plotly', connectors=False, width=1400, height=1000, inline=False)

# Save figure to html file
plotly.offline.plot(fig, filename='/Users/jakobtroidl/Desktop/3d_full.html')


split = navis.split_axon_dendrite(x, metric='flow_centrality', reroot_soma=True)


fig = split.plot3d(backend='plotly', color=split.color, connectors=False, width=1400, height=1000, inline=False)
# Save figure to html file
plotly.offline.plot(fig, filename='/Users/jakobtroidl/Desktop/3d_plot.html')


