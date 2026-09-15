import { View, Image, Text, TouchableOpacity } from 'react-native';
import { XRNLoading } from '@xrnjs/loading'
import { XRNBundle } from '@xrnjs/bundle'
import { useEffect } from 'react';
import * as RNLocalize from 'react-native-localize'
import React from 'react';

export const getDefaultSettingLanguage = () => {
	// 获取用户偏好的地区
	const preferredLocales = RNLocalize.getLocales()
	// 提取第一个地区的地区代码
	const languageCode = preferredLocales[0]?.languageCode
	const countryCode = preferredLocales[0]?.countryCode
	switch (languageCode) {
		case 'zh':
			if (countryCode === 'CN') {
				return 'zh'
			} else {
				return 'zh-TW'
			}
		case 'en':
			return 'en'
		case 'pt':
			return 'pt_BR'
		case 'fr':
			return 'fr_FR'
		case 'id':
			return 'id_ID'
		case 'vi':
			return 'vi_VN'
		case 'es':
			return 'es_ES'
		default:
			return 'en'
	}
}

const languageSource = {
	zh: {
		title: '网络加载异常，请重试',
		btn: '重试',
	},
	'zh-TW': {
		title: '網絡加載異常，請重新嘗試',
		btn: '重試',
	},
	en: {
		title: 'Oops! Something went wrong. Please try again.',
		btn: 'Retry',
	},
	pt_BR: {
		title: 'Opa! Algo deu errado. Tente novamente.',
		btn: 'Tentar',
	},
	fr_FR: {
		title: 'Oups ! Une erreur s\'est produite. Veuillez réessayer.',
		btn: 'Réessayer',
	},
	id_ID: {
		title: 'Ups! Terjadi kesalahan. Coba lagi.',
		btn: 'Muat Ulang',
	},
	vi_VN: {
		title: 'Ồ! Đã xảy ra sự cố. Vui lòng thử lại.',
		btn: 'Tải lại',
	},
	es_ES: {
		title: '¡Vaya! Algo salió mal. Por favor, inténtalo de nuevo.',
		btn: 'Reintentar',
	},
}

export default () => {
  useEffect(() => {
    try {
      XRNLoading.hide();
    } catch (error) {
      console.error(error);
    }
  }, []);
  const reloadApp = () => {
		XRNBundle.reloadBundle()
	}
  return (
		<View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: '#fff' }}>
			{/* <ErrorBlock status="notFound" fullPage image="https://static.xtransfer.com/boss/static/system_error_80ee06bfc837bc5e.png" title="网络加载异常，请重试" /> */}
			<Image
				source={{
					uri: 'https://static.xtransfer.com/boss/static/system_error_80ee06bfc837bc5e.png',
					width: 134,
					height: 134,
				}}
			/>
			<Text style={{ fontSize: 16, color: '#181721', marginTop: 16 }}>
				{languageSource[getDefaultSettingLanguage()].title}
			</Text>
			<TouchableOpacity style={{ width: '100%' }} onPress={reloadApp}>
				<View
					style={{
						backgroundColor: '#F56A00',
						borderRadius: 96,
						marginLeft: 16,
						marginRight: 16,
						height: 48,
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'row',
						marginTop: 40,
					}}
				>
					<Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
						{languageSource[getDefaultSettingLanguage()].btn}
					</Text>
				</View>
			</TouchableOpacity>
		</View>
	)
}

