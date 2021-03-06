import * as React from 'react';
import PropTypes from 'prop-types';
import debounce from './debounce.js';
import FetchItems from './FetchItems.js';
import ScrollContainer from './ScrollContainer.js';
import throttle from './throttle.js';
import MeasurementStore from './MeasurementStore.js';
import {
  getElementHeight,
  getRelativeScrollTop,
  getScrollPos,
} from './scrollUtils.js';
import {
  DefaultLayoutSymbol,
  UniformRowLayoutSymbol,
} from './legacyLayoutSymbols.js';
import defaultLayout from './defaultLayout.js';
import uniformRowLayout from './uniformRowLayout.js';
import fullWidthLayout from './fullWidthLayout.js';
import LegacyMasonryLayout from './layouts/MasonryLayout.js';
import LegacyUniformRowLayout from './layouts/UniformRowLayout.js';

type Layout =
  | typeof DefaultLayoutSymbol
  | typeof UniformRowLayoutSymbol
  | LegacyMasonryLayout
  | LegacyUniformRowLayout;

type BreakpointMap<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props<T> {
  columnWidth?: BreakpointMap<number>;
  comp: React.ComponentType<{data: T, itemIdx: number, isMeasuring: boolean}>;
  flexible?: boolean;
  gutterWidth?: number;
  items: T[];
  measurementStore?: any;
  minCols?: number;
  maxCols?: number;
  layout?: Layout;
  loadItems?: false | (({ from: number }: { from: number }) => void | boolean | {});
  scrollContainer: () => HTMLElement | null;
  virtualBoundsTop?: number;
  virtualBoundsBottom?: number;
  virtualize?: boolean;
  className?: string;
  itemClassName?: string;
}

interface State<T> {
  hasPendingMeasurements: boolean;
  isFetching: boolean;
  items: T[];
  scrollTop: number;
  width?: number;
  breakpoint?: Breakpoint;
};

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

const RESIZE_DEBOUNCE = 300;
// Multiplied against container height.
// The amount of extra buffer space for populating visible items.
const VIRTUAL_BUFFER_FACTOR = 0.7;

const layoutNumberToCssDimension = (n: number) => (n !== Infinity ? n : undefined);

const widthToBreakpoint = (w: number) =>
  w >= 1200 ? 'xl' : w >= 992 ? 'lg' : w >= 768 ? 'md' : w >= 576 ? 'sm' : 'xs';

const breakpointNumber = (obj?: BreakpointMap<number>, bp?: Breakpoint) => {
    if (typeof obj !== 'object') {
      return obj;
    }
    switch (bp) {
      case 'xl':
        if (obj.xl) return obj.xl;
      case 'lg':
        if (obj.lg) return obj.lg;
      case 'md':
        if (obj.md) return obj.md;
      case 'sm':
        if (obj.sm) return obj.sm;
      case 'xs':
        if (obj.xs) return obj.xs;
    }
}

export default class Masonry<T> extends React.Component<Props<T>, State<T>> {
  static createMeasurementStore() {
    return new MeasurementStore();
  }

  /**
   * Delays resize handling in case the scroll container is still being resized.
   */
  handleResize = debounce(() => {
    if (this.gridWrapper) {
      this.setState({
        breakpoint: widthToBreakpoint(window.innerWidth),
        width: this.gridWrapper.clientWidth,
      });
    }
  }, RESIZE_DEBOUNCE);

  updateScrollPosition = throttle(() => {
    if (!this.scrollContainer) {
      return;
    }
    const scrollContainer = this.scrollContainer.getScrollContainerRef();

    if (!scrollContainer) {
      return;
    }

    this.setState({
      scrollTop: getScrollPos(scrollContainer),
    });
  });

  measureContainerAsync = debounce(() => {
    this.measureContainer();
  }, 0);

  static propTypes = {
    /**
     * The preferred/target item width. If `flexible` is set, the item width will
     * grow to fill column space, and shrink to fit if below min columns.
     */
    columnWidth: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
        lg: PropTypes.number,
        xl: PropTypes.number,
      }),
    ]),

    /**
     * The component to render.
     */
    /* eslint react/no-unused-prop-types: 0 */
    comp: PropTypes.func.isRequired,

    /**
     * The preferred/target item width. Item width will grow to fill
     * column space, and shrink to fit if below min columns.
     */
    flexible: PropTypes.bool,

    /**
     * The amount of space between each item.
     */
    gutterWidth: PropTypes.number,

    /**
     * An array of all objects to display in the grid.
     */
    items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,

    /**
     * Measurement Store
     */
    measurementStore: PropTypes.instanceOf(MeasurementStore),

    /**
     * Layout system to use for items
     */
    layout: PropTypes.oneOfType([
      PropTypes.instanceOf(LegacyMasonryLayout),
      PropTypes.instanceOf(LegacyUniformRowLayout),
      PropTypes.symbol,
    ]),

    /**
     * A callback which the grid calls when we need to load more items as the user scrolls.
     * The callback should update the state of the items, and pass those in as props
     * to this component.
     */
    loadItems: PropTypes.func,

    /**
     * Minimum number of columns to display.
     */
    minCols: PropTypes.number,

    /**
     * Maximum number of columns to display.
     */
    maxCols: PropTypes.number,

    /**
     * Function that the grid calls to get the scroll container.
     * This is required if the grid is expected to be scrollable.
     */
    scrollContainer: PropTypes.func,

    /**
     * Whether or not to use actual virtualization
     */
    virtualize: PropTypes.bool,

    /**
     * className
     */
    className: PropTypes.string,

    /**
     * itemClassName
     */
    itemClassName: PropTypes.string,
  };

  static defaultProps = {
    columnWidth: 236,
    measurementStore: new MeasurementStore(),
    minCols: 3,
    maxCols: Infinity,
    layout: DefaultLayoutSymbol,
    loadItems: () => {},
    virtualize: false,
    className: "Masonry",
    itemClassName: "Masonry__Item Masonry__Item__Mounted",
  };

  constructor(props: Props<T>) {
    super(props);

    this.containerHeight = 0;
    this.containerOffset = 0;

    this.state = {
      hasPendingMeasurements: props.items.some(
        item => !!item && !props.measurementStore.has(item)
      ),
      isFetching: false,
      // eslint-disable-next-line react/no-unused-state
      items: props.items,
      scrollTop: 0,
      width: undefined,
    };
  }

  /**
   * Adds hooks after the component mounts.
   */
  componentDidMount() {
    window.addEventListener('resize', this.handleResize);

    this.measureContainer();

    let { scrollTop } = this.state;
    if (this.scrollContainer != null) {
      const scrollContainer = this.scrollContainer.getScrollContainerRef();
      if (scrollContainer) {
        scrollTop = getScrollPos(scrollContainer);
      }
    }

    this.setState((prevState: State<T>) => ({
      scrollTop,
      width: this.gridWrapper ? this.gridWrapper.clientWidth : prevState.width,
    }));
  }

  componentDidUpdate(_prevProps: Props<T>, prevState: State<T>) {
    const { items, measurementStore } = this.props;

    this.measureContainerAsync();

    if (prevState.width != null && this.state.width !== prevState.width) {
      measurementStore.reset();
    }
    // calculate whether we still have pending measurements
    const hasPendingMeasurements = items.some(
      (item: T) => !!item && !measurementStore.has(item)
    );
    if (
      hasPendingMeasurements ||
      hasPendingMeasurements !== this.state.hasPendingMeasurements ||
      prevState.width == null
    ) {
      this.insertAnimationFrame = requestAnimationFrame(() => {
        this.setState({
          hasPendingMeasurements,
        });
      });
    }
  }

  /**
   * Remove listeners when unmounting.
   */
  componentWillUnmount() {
    if (this.insertAnimationFrame) {
      cancelAnimationFrame(this.insertAnimationFrame);
    }

    // Make sure async methods are cancelled.
    this.measureContainerAsync.clearTimeout();
    this.handleResize.clearTimeout();
    this.updateScrollPosition.clearTimeout();

    window.removeEventListener('resize', this.handleResize);
  }

  static getDerivedStateFromProps<U>(props: Props<U>, state: State<U>) {
    const { items, measurementStore } = props;
    // whenever we're receiving new props, determine whether any items need to be measured
    // TODO - we should treat items as immutable
    const hasPendingMeasurements = items.some(
      item => !measurementStore.has(item)
    );

    // Shallow compare all items, if any change reflow the grid.
    for (let i = 0; i < items.length; i += 1) {
      // We've reached the end of our current props and everything matches.
      // If we hit this case it means we need to insert new items.
      if (state.items[i] === undefined) {
        return {
          hasPendingMeasurements,
          items,
          isFetching: false,
        };
      }

      // Reset grid items when:
      if (
        // An item object ref does not match.
        items[i] !== state.items[i] ||
        // Or less items than we currently have are passed in.
        items.length < state.items.length
      ) {
        return {
          hasPendingMeasurements,
          items,
          isFetching: false,
        };
      }
    }

    // Reset items if new items array is empty.
    if (items.length === 0 && state.items.length > 0) {
      return {
        hasPendingMeasurements,
        items,
        isFetching: false,
      };
    }
    if (hasPendingMeasurements !== state.hasPendingMeasurements) {
      // make sure we always update hasPendingMeasurements
      return {
        hasPendingMeasurements,
        items,
      };
    }

    // Return null to indicate no change to state.
    return null;
  }

  setGridWrapperRef = (ref: HTMLElement | null) => {
    this.gridWrapper = ref;
  };

  setScrollContainerRef = (ref: ScrollContainer | null) => {
    this.scrollContainer = ref;
  };

  fetchMore = () => {
    const { loadItems } = this.props;
    if (loadItems && typeof loadItems === 'function') {
      this.setState(
        {
          isFetching: true,
        },
        () => loadItems({ from: this.props.items.length })
      );
    }
  };

  containerHeight: number;

  containerOffset: number;

  gridWrapper: HTMLElement | null = null;

  insertAnimationFrame?: number;

  scrollContainer: ScrollContainer | null = null;

  measureContainer() {
    if (this.scrollContainer != null) {
      const { scrollContainer } = this;
      const scrollContainerRef = scrollContainer.getScrollContainerRef();
      if (scrollContainerRef) {
        this.containerHeight = getElementHeight(scrollContainerRef);
        const el = this.gridWrapper;
        if (el instanceof HTMLElement) {
          const relativeScrollTop = getRelativeScrollTop(scrollContainerRef);
          this.containerOffset =
            el.getBoundingClientRect().top + relativeScrollTop;
        }
      }
    }
  }

  /**
   * Clear measurements/positions and force a reflow of the entire grid.
   * Only use this if absolutely necessary - ex: We need to reflow items if the
   * number of columns we would display should change after a resize.
   */
  reflow() {
    this.props.measurementStore.reset();
    this.measureContainer();
    this.forceUpdate();
  }

  renderMasonryComponent = (itemData: T, idx: number, position: Position) => {
    const {
      comp: Component,
      virtualize,
      virtualBoundsTop,
      virtualBoundsBottom,
      itemClassName,
    } = this.props;
    const { top, left, width, height } = position;

    let isVisible;
    if (this.props.scrollContainer) {
      const virtualBuffer = this.containerHeight * VIRTUAL_BUFFER_FACTOR;
      const offsetScrollPos = this.state.scrollTop - this.containerOffset;
      const viewportTop = virtualBoundsTop
        ? offsetScrollPos - virtualBoundsTop
        : offsetScrollPos - virtualBuffer;
      const viewportBottom = virtualBoundsBottom
        ? offsetScrollPos + this.containerHeight + virtualBoundsBottom
        : offsetScrollPos + this.containerHeight + virtualBuffer;

      isVisible = !(
        position.top + position.height < viewportTop ||
        position.top > viewportBottom
      );
    } else {
      // if no scroll container is passed in, items should always be visible
      isVisible = true;
    }

    const itemComponent = (
      <div
        key={`item-${idx}`}
        className={itemClassName}
        data-grid-item
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translateX(${left}px) translateY(${top}px)`,
          WebkitTransform: `translateX(${left}px) translateY(${top}px)`,
          width: layoutNumberToCssDimension(width),
          height: layoutNumberToCssDimension(height),
        }}
      >
        <Component data={itemData} itemIdx={idx} isMeasuring={false} />
      </div>
    );

    return virtualize ? (isVisible && itemComponent) || null : itemComponent;
  };

  render() {
    const {
      columnWidth,
      comp: Component,
      flexible,
      gutterWidth: gutter,
      measurementStore,
      items,
      minCols,
      maxCols,
      className,
    } = this.props;
    const { hasPendingMeasurements, width, breakpoint } = this.state;

    let layout, extra;
    if (flexible && width !== null) {
      extra = {
        'data-masonry': JSON.stringify({
          layout: 'fullWidth',
          idealColumnWidth: columnWidth || 240,
          gutter: gutter || 0,
          minCols: minCols || 2,
          maxCols: maxCols || Infinity,
        }),
      }
      layout = fullWidthLayout({
        gutter,
        cache: measurementStore,
        minCols,
        maxCols,
        idealColumnWidth: breakpointNumber(columnWidth, breakpoint),
        width,
      });
    } else if (
      this.props.layout === UniformRowLayoutSymbol ||
      this.props.layout instanceof LegacyUniformRowLayout
    ) {
      extra = {
        'data-masonry': JSON.stringify({
          layout: 'uniformRow',
          columnWidth: columnWidth || 236,
          gutter: gutter || 14,
          minCols: minCols || 3,
          maxCols: maxCols || Infinity,
        }),
      }
      layout = uniformRowLayout({
        cache: measurementStore,
        columnWidth: breakpointNumber(columnWidth, breakpoint),
        gutter,
        minCols,
        maxCols,
        width,
      });
    } else {
      extra = {
        'data-masonry': JSON.stringify({
          layout: 'default',
          columnWidth: columnWidth || 236,
          gutter: gutter || 14,
          minCols: minCols || 2,
          maxCols: maxCols || Infinity,
        }),
      }
      layout = defaultLayout({
        cache: measurementStore,
        columnWidth: breakpointNumber(columnWidth, breakpoint),
        gutter,
        minCols,
        maxCols,
        width,
      });
    }

    let gridBody;
    if (width == null && hasPendingMeasurements) {
      // When hyrdating from a server render, we don't have the width of the grid
      // and the measurement store is empty
      gridBody = (
        <div
          className={className}
          style={{
            position: 'relative',
            margin: '0 auto',
            height: 0,
            width: '100%',
          }}
          ref={this.setGridWrapperRef}
          {...extra}
        >
          {items.filter((item: T) => item).map((item: T, i: number) => (
            <div // keep this in sync with renderMasonryComponent
              className="static"
              data-grid-item
              key={i}
              style={{
                visibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'translateX(0px) translateY(0px)',
                WebkitTransform: 'translateX(0px) translateY(0px)',
                width: undefined, // we can't set a width for server rendered items
              }}
              ref={el => {
                if (el && !flexible) {
                  // only measure flexible items on client
                  measurementStore.set(item, el.clientHeight);
                }
              }}
            >
              <Component data={item} itemIdx={i} isMeasuring={false} />
            </div>
          ))}
        </div>
      );
    } else if (width == null) {
      // When the width is empty (usually after a re-mount) render an empty
      // div to collect the width for layout
      gridBody = <div style={{ width: '100%' }} ref={this.setGridWrapperRef} />;
    } else {
      // Full layout is possible
      const itemsToRender = items.filter(
        (item: T) => item && measurementStore.has(item)
      );
      const itemsToMeasure = items
        .filter((item: T) => item && !measurementStore.has(item))
        .slice(0, minCols);

      const positions = layout(itemsToRender);
      const measuringPositions = layout(itemsToMeasure);
      // Math.max() === -Infinity when there are no positions
      const height = positions.length
        ? Math.max(...positions.map(pos => pos.top + pos.height))
        : 0;
      gridBody = (
        <div style={{ width: '100%' }} ref={this.setGridWrapperRef}>
          <div
            className={className}
            style={{
              position: 'relative',
              margin: '0 auto',
              height,
              width,
            }}
          >
            {itemsToRender.map((item, i) =>
              this.renderMasonryComponent(item, i, positions[i])
            )}
          </div>
          <div
            className={className}
            style={{
              position: 'relative',
              margin: '0 auto',
              height: '100%',
              width,
            }}
          >
            {itemsToMeasure.map((data, i) => {
              // itemsToMeasure is always the length of minCols, so i will always be 0..minCols.length
              // we normalize the index here relative to the item list as a whole so that itemIdx is correct
              // and so that React doesnt reuse the measurement nodes
              const measurementIndex = itemsToRender.length + i;
              const position = measuringPositions[i];
              return (
                <div
                  key={`measuring-${measurementIndex}`}
                  style={{
                    visibility: 'hidden',
                    position: 'absolute',
                    top: layoutNumberToCssDimension(position.top),
                    left: layoutNumberToCssDimension(position.left),
                    width: layoutNumberToCssDimension(position.width),
                    height: layoutNumberToCssDimension(position.height),
                  }}
                  ref={el => {
                    if (el) {
                      measurementStore.set(data, el.clientHeight);
                    }
                  }}
                >
                  <Component
                    data={data}
                    itemIdx={measurementIndex}
                    isMeasuring
                  />
                </div>
              );
            })}
          </div>

          {this.scrollContainer && (
            <FetchItems
              containerHeight={this.containerHeight}
              fetchMore={this.fetchMore}
              isFetching={
                this.state.isFetching || this.state.hasPendingMeasurements
              }
              scrollHeight={height}
              scrollTop={this.state.scrollTop}
            />
          )}
        </div>
      );
    }

    return this.props.scrollContainer ? (
      <ScrollContainer
        ref={this.setScrollContainerRef}
        onScroll={this.updateScrollPosition}
        scrollContainer={this.props.scrollContainer}
      >
        {gridBody}
      </ScrollContainer>
    ) : (
      gridBody
    );
  }
}
