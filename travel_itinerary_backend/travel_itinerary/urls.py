from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Correct imports for djangosaml2 1.11.1
# from djangosaml2.views import login, logout, assertion_consumer_service

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/employee-profile/', views.employee_profile_view, name='employee_profile'),

    # # ACS endpoint: Azure posts to /cas/login?client_name=AzureSSO
    # path('cas/login', assertion_consumer_service, name='saml2_acs'),
    # path('saml2/login/', login, name='saml2_login'),
    # path('saml2/logout/', logout, name='saml2_logout'),
    
    # Itineraries
    path('itineraries/', views.itineraries_view, name='itineraries'),
    path('itineraries/<int:pk>/', views.itinerary_detail_view, name='itinerary_detail'),
]