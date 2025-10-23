from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/employee-profile/', views.employee_profile_view, name='employee_profile'),


    # Itineraries
    path('itineraries/', views.itineraries_view, name='itineraries'),
    path('itineraries/<int:pk>/', views.itinerary_detail_view, name='itinerary_detail'),
    
]
