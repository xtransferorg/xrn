'use client';

import {
  Platform,
  createSnapshotFriendlyRef,
  UnavailabilityError
} from '@xrnjs/modules-core';
import React from 'react';
import { ImageRequireSource, StyleSheet, type View } from 'react-native';

import ExpoImage from './ExpoImage';
import { ImagePrefetchOptions, ImageProps, ImageSource } from './Image.types';
import XTFastImage from './XTFastImage';
import ImageModule from './native/NativeXRNImageModule';
import {
  resolveContentFit,
  resolveContentPosition,
  resolveTransition
} from './utils';
import { resolveSources } from './utils/resolveSources';

import FastImage, { Source } from 'react-native-fast-image';
import { triggerImageLoadEndCallback } from './imageMonitorHook';

const isHarmony = Platform.OS === 'harmony';

function checkSupportHarmony() {
  if (isHarmony) {
    throw new UnavailabilityError(
      '@xrnjs/image',
      'This method is not available on HarmonyOS'
    );
  }
}

let loggedDefaultSourceDeprecationWarning = false;
let loggedRenderingChildrenWarning = false;

export class Image extends React.PureComponent<ImageProps> {
  nativeViewRef: React.RefObject<ExpoImage | null>;
  containerViewRef: React.RefObject<View | null>;

  constructor(props: ImageProps) {
    super(props);
    this.nativeViewRef = createSnapshotFriendlyRef();
    this.containerViewRef = createSnapshotFriendlyRef();
  }

  // Reanimated support on web
  getAnimatableRef = () => {
    if (Platform.OS === 'web') {
      return this.containerViewRef.current;
    } else {
      return this;
    }
  };

  /**
   * Preloads images at the given URLs that can be later used in the image view.
   * Preloaded images are cached to the memory and disk by default, so make sure
   * to use `disk` (default) or `memory-disk` [cache policy](#cachepolicy).
   * @param urls - A URL string or an array of URLs of images to prefetch.
   * @param {ImagePrefetchOptions['cachePolicy']} cachePolicy - The cache policy for prefetched images.
   * @return A promise resolving to `true` as soon as all images have been
   * successfully prefetched. If an image fails to be prefetched, the promise
   * will immediately resolve to `false` regardless of whether other images have
   * finished prefetching.
   */
  static async prefetch(
    urls: string | string[],
    cachePolicy?: ImagePrefetchOptions['cachePolicy']
  ): Promise<boolean>;
  /**
   * Preloads images at the given URLs that can be later used in the image view.
   * Preloaded images are cached to the memory and disk by default, so make sure
   * to use `disk` (default) or `memory-disk` [cache policy](#cachepolicy).
   * @param urls - A URL string or an array of URLs of images to prefetch.
   * @param options - Options for prefetching images.
   * @return A promise resolving to `true` as soon as all images have been
   * successfully prefetched. If an image fails to be prefetched, the promise
   * will immediately resolve to `false` regardless of whether other images have
   * finished prefetching.
   */
  static async prefetch(
    urls: string | string[],
    options?: ImagePrefetchOptions
  ): Promise<boolean>;
  static async prefetch(
    urls: string | string[],
    options?: ImagePrefetchOptions['cachePolicy'] | ImagePrefetchOptions
  ): Promise<boolean> {
    let cachePolicy: ImagePrefetchOptions['cachePolicy'] = 'memory-disk';
    let headers: ImagePrefetchOptions['headers'];
    switch (typeof options) {
      case 'string':
        cachePolicy = options;
        break;
      case 'object':
        cachePolicy = options.cachePolicy ?? cachePolicy;
        headers = options.headers;
        break;
    }

    if (isHarmony) {
      const urlArray = Array.isArray(urls) ? urls : [urls];
      const fastSources = urlArray.map((uri) => {
        const source: Source = {
          uri,
          headers
        };
        return source;
      });
      FastImage.preload(fastSources);
      return Promise.resolve(true);
    }

    return ImageModule.prefetch(
      Array.isArray(urls) ? urls : [urls],
      cachePolicy,
      headers
    );
  }

  /**
   * Asynchronously clears all images stored in memory.
   * @platform android
   * @platform ios
   * @return A promise resolving to `true` when the operation succeeds.
   * It may resolve to `false` on Android when the activity is no longer available.
   * Resolves to `false` on Web.
   */
  static async clearMemoryCache(): Promise<boolean> {
    if (isHarmony) {
      await FastImage.clearMemoryCache();
      return Promise.resolve(true);
    }
    return await ImageModule.clearMemoryCache();
  }

  /**
   * Asynchronously clears all images from the disk cache.
   * @platform android
   * @platform ios
   * @return A promise resolving to `true` when the operation succeeds.
   * It may resolve to `false` on Android when the activity is no longer available.
   * Resolves to `false` on Web.
   */
  static async clearDiskCache(): Promise<boolean> {
    if (isHarmony) {
      await FastImage.clearDiskCache();
      return Promise.resolve(true);
    }
    return await ImageModule.clearDiskCache();
  }

  /**
   * Asynchronously checks if an image exists in the disk cache and resolves to
   * the path of the cached image if it does.
   * @param cacheKey - The cache key for the requested image. Unless you have set
   * a custom cache key, this will be the source URL of the image.
   * @platform android
   * @platform ios
   * @return A promise resolving to the path of the cached image. It will resolve
   * to `null` if the image does not exist in the cache.
   */
  static async getCachePathAsync(cacheKey: string): Promise<string | null> {
    checkSupportHarmony();
    return await ImageModule.getCachePathAsync(cacheKey);
  }

  /**
   * Asynchronously generates a [Blurhash](https://blurha.sh) from an image.
   * @param source - The image source, either a URL (string) or an ImageRef
   * @param numberOfComponents - The number of components to encode the blurhash with.
   * Must be between 1 and 9. Defaults to `[4, 3]`.
   * @platform android
   * @platform ios
   * @return A promise resolving to the blurhash string.
   */
  // static async generateBlurhashAsync(
  //   source: string | ImageRef,
  //   numberOfComponents: [number, number] | { width: number; height: number }
  // ): Promise<string | null> {
  //   return ImageModule.generateBlurhashAsync(source, numberOfComponents);
  // }

  /**
   * Asynchronously starts playback of the view's image if it is animated.
   * @platform android
   * @platform ios
   */
  async startAnimating(): Promise<void> {
    checkSupportHarmony();
    await this.nativeViewRef.current?.startAnimating();
  }

  /**
   * Asynchronously stops the playback of the view's image if it is animated.
   * @platform android
   * @platform ios
   */
  async stopAnimating(): Promise<void> {
    checkSupportHarmony();
    await this.nativeViewRef.current?.stopAnimating();
  }

  /**
   * Loads an image from the given source to memory and resolves to
   * an object that references the native image instance.
   * @platform android
   * @platform ios
   * @platform web
   */
  /* static async loadAsync(
    source: ImageSource | string,
    options?: ImageLoadOptions
  ): Promise<ImageRef> {
    const resolvedSource = resolveSource(source) as ImageSource;
    return await ImageModule.loadAsync(resolvedSource, options);
  } */

  render() {
    const {
      style,
      source,
      placeholder,
      contentFit,
      contentPosition,
      transition,
      fadeDuration,
      resizeMode: resizeModeProp,
      defaultSource,
      loadingIndicatorSource,
      ...restProps
    } = this.props;

    const { resizeMode: resizeModeStyle, ...restStyle } =
      StyleSheet.flatten(style) || {};
    const resizeMode = resizeModeProp ?? resizeModeStyle;

    if (
      (defaultSource || loadingIndicatorSource) &&
      !loggedDefaultSourceDeprecationWarning
    ) {
      console.warn(
        '[expo-image]: `defaultSource` and `loadingIndicatorSource` props are deprecated, use `placeholder` instead'
      );
      loggedDefaultSourceDeprecationWarning = true;
    }
    // @ts-expect-error
    if (restProps.children && !loggedRenderingChildrenWarning) {
      console.warn(
        'The <Image> component does not support children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.'
      );
      loggedRenderingChildrenWarning = true;
    }

    const resolvedSources = resolveSources(source);

    let resolvedStyle: ImageProps['style'] = restStyle;

    if (Array.isArray(resolvedSources) && resolvedSources.length === 1) {
      const source = resolvedSources[0];
      if (source && source.uri) {
        const { width, height } = source;
        resolvedStyle = StyleSheet.flatten([{ width, height }, restStyle]);
      }
    }

    let fastImageSource: Source | ImageRequireSource | undefined = undefined;
    // 本地图片
    if (typeof source === 'number') {
      fastImageSource = source;
    } else {
      // 网络图片
      const source = (resolvedSources as ImageSource[])[0];
      const priority = !this.props.priority ? undefined : this.props.priority;
      fastImageSource = {
        uri: source.uri,
        headers: source.headers,
        priority: priority
        //cache: cache //TODO
      };
    }

    // 本地图片
    let fastImagePlaceholder: ImageRequireSource | undefined = undefined;
    if (typeof placeholder === 'number') {
      fastImagePlaceholder = placeholder;
    }

    return isHarmony ? (
      <XTFastImage
        {...restProps}
        style={resolvedStyle}
        source={fastImageSource}
        placeholder={fastImagePlaceholder}
        contentFit={resolveContentFit(contentFit, resizeMode)}
        contentPosition={resolveContentPosition(contentPosition)}
        transition={resolveTransition(transition, fadeDuration)}
        nativeViewRef={this.nativeViewRef}
        containerViewRef={this.containerViewRef}
        onLoadEnd={() => {
          triggerImageLoadEndCallback(this.nativeViewRef, {
            source: fastImageSource
          });
          restProps.onLoadEnd?.();
        }}
      />
    ) : (
      <ExpoImage
        {...restProps}
        style={resolvedStyle}
        source={resolvedSources}
        placeholder={resolveSources(
          placeholder ?? defaultSource ?? loadingIndicatorSource
        )}
        contentFit={resolveContentFit(contentFit, resizeMode)}
        contentPosition={resolveContentPosition(contentPosition)}
        transition={resolveTransition(transition, fadeDuration)}
        nativeViewRef={this.nativeViewRef}
        containerViewRef={this.containerViewRef}
        onDisplay={() => {
          triggerImageLoadEndCallback(this.nativeViewRef, {
            source: resolvedSources?.[0]
          });
          restProps.onDisplay?.();
        }}
      />
    );
  }
}
