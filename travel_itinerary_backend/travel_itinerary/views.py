from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, ItinerarySerializer, EmployeeSerializer
from .models import Itinerary, Employee
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint that returns JWT tokens
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        user_serializer = UserSerializer(user)
        
        return Response({
            'message': 'Login successful',
            'user': user_serializer.data,
            'access_token': serializer.validated_data['access_token'],
            'refresh_token': serializer.validated_data['refresh_token'],
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register new user endpoint
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User created successfully',
            'user': user_serializer.data,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    try:
        refresh_token = request.data["refresh_token"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_profile_view(request):
    """
    Get current employee profile data from Employee table
    """
    try:
        employee = Employee.objects.get(user=request.user)
    except Employee.DoesNotExist:
        return Response({'detail': 'Employee data not found'}, status=404)

    serializer = EmployeeSerializer(employee)
    return Response(serializer.data)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def itineraries_view(request):
    if request.method == 'POST':
        serializer = ItinerarySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            itinerary = serializer.save(user=request.user)
            return Response(ItinerarySerializer(itinerary).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET list
    qs = Itinerary.objects.filter(user=request.user)
    paginator = StandardResultsSetPagination()
    result_page = paginator.paginate_queryset(qs, request)
    serializer = ItinerarySerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def itinerary_detail_view(request, pk: int):
    try:
        itinerary = Itinerary.objects.get(pk=pk, user=request.user)
    except Itinerary.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ItinerarySerializer(itinerary).data)

    if request.method == 'PUT':
        serializer = ItinerarySerializer(itinerary, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'PATCH':
        # Example: Withdraw itinerary
        if itinerary.status in ["Completed", "Rejected", "Withdrawn"]:
            return Response({"detail": "Cannot withdraw"}, status=status.HTTP_400_BAD_REQUEST)

        itinerary.status = "Withdrawn"
        itinerary.save()
        return Response(ItinerarySerializer(itinerary).data)

    if request.method == 'DELETE':
        itinerary.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
