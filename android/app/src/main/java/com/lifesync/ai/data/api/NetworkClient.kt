package com.lifesync.ai.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkClient {

    // Default for Android Emulator to access host machine is 10.0.2.2.
    // For physical devices on the same Wi-Fi, change this to host machine's LAN IP.
    var baseUrl: String = "http://10.0.2.2:5000/"
        set(value) {
            field = if (value.endsWith("/")) value else "$value/"
            apiService = createApiService(field)
        }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    private fun createApiService(url: String): LifeSyncApiService {
        return Retrofit.Builder()
            .baseUrl(url)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(LifeSyncApiService::class.java)
    }

    var apiService: LifeSyncApiService = createApiService(baseUrl)
        private set
}
