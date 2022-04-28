# Deephaven Interactive JavaScript Plugin

Use this plugin to interactive with `deephaven.plugin.interactive` objects from the server.

## Development

```
npm install
npm run build
```

Your output will be in `dist/index.js`

## Usage

Define a function that you want to rerun when inputs are changed. Then, pass the function along with the defined inputs to create an interactive query.

### Basic Example

Creates a table that simply updates with the value of the slider.

```python
from deephaven.plugin.interactive import InteractiveQuery, slider
from deephaven import empty_table

def my_func(x):
    t = empty_table(1).update_view([f"x={x}"])
    return { 't': t }

my_query = InteractiveQuery(my_func, x=slider(0))
```

### Plotting Example

Create two plots showing a sine function and cosine function with the values set from the slider.

```python
from deephaven.plugin.interactive import InteractiveQuery, slider
from deephaven import empty_table
from deephaven.plot.figure import Figure

def sin_func(amplitude, frequency, phase):
    t = empty_table(1000).update_view(["x=i", f"y={amplitude}*Math.sin(x*{frequency}+{phase})"])
    f = Figure().plot_xy(series_name="Series", t=t, x="x", y="y").show()
    return { 't': t, 'f': f }

def cos_func(amplitude, frequency, phase):
    t = empty_table(1000).update_view(["x=i", f"y={amplitude}*Math.cos(x*{frequency}+{phase})"])
    f = Figure().plot_xy(series_name="Series", t=t, x="x", y="y").show()
    return { 't': t, 'f': f }

inputs = {'amplitude': slider(1), 'frequency': slider(1), 'phase': slider(1)}

iqs = InteractiveQuery(sin_func, **inputs)
iqc = InteractiveQuery(cos_func, **inputs)
```
