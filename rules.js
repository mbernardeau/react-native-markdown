import React from 'react';

import {
  Image,
  Text,
  View,
} from 'react-native';

import Lightbox from 'react-native-lightbox';

import SimpleMarkdown from 'simple-markdown';
import _ from 'lodash';

module.exports = function(styles, opts = {}) {
  const enableLightBox = opts.enableLightBox || false;
  const navigator = opts.navigator;

  const LINK_INSIDE = '(?:\\[[^\\]]*\\]|[^\\]]|\\](?=[^\\[]*\\]))*';
  const LINK_HREF_AND_TITLE =
          "\\s*<?([^\\s]*?)>?(?:\\s+['\"]([\\s\\S]*?)['\"])?\\s*";
  var pressHandler = function(target) {
    if (opts.onLink) {
      opts.onLink(target);
    }
  };
  return {
    autolink: {
      react: function(node, output, state) {
        state.withinText = true;
        const _pressHandler = () => {
          pressHandler(node.target);
        };
        return React.createElement(Text, {
          key: state.key,
          style: styles.autolink,
          onPress: _pressHandler,
        }, output(node.content, state));
      },
    },
    blockQuote: {
      react: function(node, output, state) {
        state.withinQuote = true;
        let blockQuote = React.createElement(Text, {
          key: state.key,
          style: styles.blockQuote,
        }, output(node.content, state));
        const image = _.get(opts, ['bgImage', 'blockQuote']);
        if (image) {
          const img = React.createElement(Image, {
            key: 1,
            resizeMode: 'cover',
            source: image,
            style: styles.bgImage,
          });
          return React.createElement(View, {
            key: state.key,
            style: styles.bgImageView,
          }, [img, blockQuote]);
        }
        return blockQuote;
      },
    },
    br: {
      react: function(node, output, state) {
        return React.createElement(Text, {
          key: state.key,
          style: styles.br,
        }, '\n\n');
      },
    },
    codeBlock: {
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.codeBlock,
        }, null);
      },
    },
    del: {
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.del,
        }, output(node.content, state));
      },
    },
    em: {
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.em,
        }, output(node.content, state));
      },
    },
    heading: {
      match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n *)+/),
      react: function(node, output, state) {
        state.withinText = true;
        state.withinHeading = true;
        const ret = React.createElement(Text, {
          key: state.key,
          style: [styles.heading, styles['heading' + node.level]],
        }, output(node.content, state));
        state.withinHeading = false;
        return ret;
      },
    },
    hr: {
      react: function(node, output, state) {
        return React.createElement(View, { key: state.key, style: styles.hr });
      },
    },
    image: {
      react: function(node, output, state) {
        var imageParam = opts.imageParam ? opts.imageParam : '';
        var target = node.target + imageParam;
        var image = React.createElement(Image, {
          key: state.key,
          // resizeMode: 'contain',
          source: { uri: target },
          style: styles.image,
        });
        if (enableLightBox) {
          return React.createElement(Lightbox, {
            activeProps: styles.imageBox,
            key: state.key,
            navigator,
            onOpen: opts.onImageOpen,
            onClose: opts.onImageClose,
          }, image);
        }
        return image;
      },
    },
    inlineCode: {
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.inlineCode,
        }, output(node.content, state));
      },
    },
    link: {
      match: SimpleMarkdown.inlineRegex(new RegExp(
          '^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)'
      )),
      react: function(node, output, state) {
        state.withinLink = true;
        const _pressHandler = () => {
          pressHandler(node.target);
        };
        const link = React.createElement(Text, {
          key: state.key,
          style: styles.autolink,
          onPress: _pressHandler,
        }, output(node.content, state));
        state.withinLink = false;
        return link;
      },
    },
    list: {
      react: function(node, output, state) {

        var items = _.map(node.items, function(item, i) {
          var bullet;
          if (node.ordered) {
            bullet = React.createElement(Text, { key: 0, style: styles.listItemNumber }, (i + 1) + '. ');
          }
          else {
            bullet = React.createElement(Text, { key: 0, style: styles.listItemBullet }, '\u2022 ');
          }

          var content = output(item, state);
          var listItem;
          state.withinList = true;
          if (_.includes(['text', 'paragraph', 'strong'], (_.head(item) || {}).type)) {
            listItem = React.createElement(Text, {
              style: styles.listItemText,
              key: 1,
            }, content);
          } else {
            listItem = React.createElement(View, {
              style: styles.listItem,
              key: 1,
            }, content);
          }
          state.withinList = false;

          return React.createElement(View, {
            key: i,
            style: styles.listRow,
          }, [bullet, listItem]);
        });

        return React.createElement(View, { key: state.key, style: styles.list }, items);
      },
    },
    mailto: {
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.mailto,
          onPress: _.noop,
        }, output(node.content, state));
      },
    },
    newline: {
      react: function(node, output, state) {
        return React.createElement(Text, {
          key: state.key,
          style: styles.newline,
        }, '\n');
      },
    },
    paragraph: {
      react: function(node, output, state) {
        let paragraphStyle = styles.paragraph;
        // Allow image to drop in next line within the paragraph
        if (_.some(node.content, {type: 'image'})) {
          state.withinParagraphWithImage = true;
          var paragraph = React.createElement(View, {
            key: state.key,
            style: styles.paragraphWithImage,
          }, output(node.content, state));
          state.withinParagraphWithImage = false;
          return paragraph;
        } else if (_.size(node.content) < 3 && _.some(node.content, {type: 'strong'})){
          // align to center for Strong only content
          // require a check of content array size below 3,
          // as parse will include additional space as `text`
          paragraphStyle = styles.paragraphCenter;
        }
        if (state.withinList) {
          paragraphStyle = [paragraphStyle, styles.noMargin];
        }
        return React.createElement(Text, {
          key: state.key,
          style: paragraphStyle,
        }, output(node.content, state));
      },
    },
    strong: {
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.strong,
        }, output(node.content, state));
      },
    },
    table: {
      react: function(node, output, state) {
        var headers = _.map(node.header, function(content, i) {
          return React.createElement(Text, {
            key: i,
            style: styles.tableHeaderCell,
          }, output(content, state));
        });

        var header = React.createElement(View, { key: -1, style: styles.tableHeader }, headers);

        var rows = _.map(node.cells, function(row, r) {
          var cells = _.map(row, function(content, c) {
            return React.createElement(View, {
              key: c,
              style: styles.tableRowCell,
            }, output(content, state));
          });
          var rowStyles = [styles.tableRow];
          if (node.cells.length - 1 == r) {
            rowStyles.push(styles.tableRowLast);
          }
          return React.createElement(View, { key: r, style: rowStyles }, cells);
        });

        return React.createElement(View, { key: state.key, style: styles.table }, [ header, rows ]);
      },
    },
    text: {
      react: function(node, output, state) {
        let textStyle = styles.text;
        if (state.withinLink) {
          textStyle = [styles.text, styles.autolink];
        }
        return React.createElement(Text, {
          key: state.key,
          style: textStyle,
        }, node.content);
      },
    },
    u: { // u will to the same as strong, to avoid the View nested inside text problem
      react: function(node, output, state) {
        state.withinText = true;
        return React.createElement(Text, {
          key: state.key,
          style: styles.strong,
        }, output(node.content, state));
      },
    },
    url: {
      react: function(node, output, state) {
        state.withinText = true;
        const _pressHandler = () => {
          pressHandler(node.target);
        };
        return React.createElement(Text, {
          key: state.key,
          style: styles.autolink,
          onPress: _pressHandler,
        }, output(node.content, state));
      },
    },
  };
};
