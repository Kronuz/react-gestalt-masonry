# Masonry

Masonry creates a deterministic grid layout, positioning items based on
available vertical space. It contains performance optimizations like
virtualization and server rendering, as well as support for infinite
scrolling.

Extracted from gestalt and ported to TypeScript by Kronuz.

Usage here:
https://pinterest.github.io/gestalt/#/Masonry

```jsx
import * from React from 'react';
import Masonry from 'masonry';

class Example extends React.Component {
  constructor(props) {
    super(props);

    this.renderItem = this.renderItem.bind(this);
    this.loadItems = this.loadItems.bind(this);

    this.state = {
      items: [],
    }
  }

  renderItem({ data, itemIdx }) {
    return (
      <div
        style={{
          backgroundColor: `${data.color || '#f4f4f4'}`,
          paddingBottom: `${(data.naturalHeight / data.naturalWidth) * 100}%`,
          position: 'relative',
        }}
      >
        <img
          alt="masonry image"
          color={data.color}
          src={data.src}
          style={{ display: 'block', position: 'absolute', width: '100%' }}
        />
      </div>
    );
  }

  loadItems() {
    const items = []; // fetch and put items here
    this.setState({
      items,
    });

  }

  render() {
    return (
      <Masonry
        comp={this.renderItem}
        items={this.state.items}
        loadItems={this.loadItems}
        minCols={2}
        scrollContainer={() => window}
        virtualize
      />
    )
  }
}
```
