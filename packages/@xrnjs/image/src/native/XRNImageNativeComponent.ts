import type { ColorValue, HostComponent, ViewProps } from 'react-native';
import {
  DirectEventHandler,
  Float,
  Int32,
  WithDefault
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type ImageSource = {
  /**
   * A string representing the resource identifier for the image,
   * which could be an HTTPS address, a local file path, or the name of a static image resource.
   */
  uri?: string;
  /**
   * An object representing the HTTP headers to send along with the request for a remote image.
   * On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain.
   */
  headers?: {};
  /**
   * Can be specified if known at build time, in which case the value
   * will be used to set the default `<Image/>` component dimension.
   */
  width?: Float;
  /**
   * Can be specified if known at build time, in which case the value
   * will be used to set the default `<Image/>` component dimension.
   */
  height?: Float;

  /**
   * A string used to generate the image [`placeholder`](#placeholder). For example,
   * `placeholder={blurhash}`.  If `uri` is provided as the value of the `source` prop,
   * this is ignored since the `source` can only have `blurhash` or `uri`.
   *
   * When using the blurhash, you should also provide `width` and `height` (higher values reduce performance),
   * otherwise their default value is `16`.
   * For more information, see [`woltapp/blurhash`](https://github.com/woltapp/blurhash) repository.
   */
  blurhash?: string;

  /**
   * A string used to generate the image [`placeholder`](#placeholder). For example,
   * `placeholder={thumbhash}`.  If `uri` is provided as the value of the `source` prop,
   * this is ignored since the `source` can only have `thumbhash` or `uri`.
   *
   * For more information, see [`thumbhash website`](https://evanw.github.io/thumbhash/).
   */
  thumbhash?: string;

  /**
   * The cache key used to query and store this specific image.
   * If not provided, the `uri` is used also as the cache key.
   */
  cacheKey?: string;

  /**
   * Whether the image is animated (an animated GIF or WebP for example).
   * @platform android
   * @platform ios
   */
  isAnimated?: boolean;
};

type ContentPosition = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
};

type ImageTransition = {
  duration?: Int32;
};

type ImageLoadEvent = {
  cacheType: 'none' | 'disk' | 'memory';
  source: {
    url: string;
    width: Float;
    height: Float;
    mediaType: string;
  };
};

type ImageProgressEvent = {
  loaded: Int32;
  total: Int32;
};

type ImageErrorEvent = {
  error: string;
};

export interface NativeProps extends ViewProps {
  source?: readonly ImageSource[];
  placeholder?: readonly ImageSource[];
  contentFit?: WithDefault<
    'cover' | 'contain' | 'fill' | 'scale-down' | 'none',
    'cover'
  >;
  placeholderContentFit?: WithDefault<
    'cover' | 'contain' | 'fill' | 'scale-down' | 'none',
    'scale-down'
  >;
  contentPosition?: ContentPosition;
  blurRadius?: Int32;
  transition?: ImageTransition;
  tintColor?: ColorValue;
  accessible?: boolean;
  focusable?: boolean;
  priority?: WithDefault<'low' | 'normal' | 'high', 'normal'>;
  cachePolicy?: WithDefault<'none' | 'disk' | 'memory' | 'memory-disk', 'disk'>;
  recyclingKey?: string;
  allowDownscaling?: WithDefault<boolean, false>;
  autoplay?: WithDefault<boolean, false>;
  decodeFormat?: WithDefault<'argb' | 'rgb', 'argb'>;

  onLoad?: DirectEventHandler<ImageLoadEvent>;
  onLoadStart?: DirectEventHandler<{}>;
  onLoadEnd?: DirectEventHandler<{}>;
  onProgress?: DirectEventHandler<ImageProgressEvent>;
  onDisplay?: DirectEventHandler<{}>;
  onError?: DirectEventHandler<ImageErrorEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'XRNImageView'
) as HostComponent<NativeProps>;
