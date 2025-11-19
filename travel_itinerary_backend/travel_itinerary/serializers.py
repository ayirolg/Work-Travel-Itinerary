from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Itinerary, Employee


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id', 'is_active']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            attrs['user'] = user
            attrs['access_token'] = str(refresh.access_token)
            attrs['refresh_token'] = str(refresh)
            
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user



class ItinerarySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    employee = serializers.SerializerMethodField()

    class Meta:
        model = Itinerary
        fields = [
            'id', 'user', 'employee', 'from_city', 'to_city', 'start_date', 'end_date',
            'status', 'type', 'mode', 'purpose', 'request_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'request_date', 'created_at', 'updated_at', 'status']

    def get_employee(self, obj):
        try:
            employee = Employee.objects.get(user=obj.user)
            return EmployeeSerializer(employee).data
        except Employee.DoesNotExist:
            return None




class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'employee_id', 'first_name', 'last_name', 'email', 'contact_number',
            'designation', 'band', 'department', 'location'
        ]