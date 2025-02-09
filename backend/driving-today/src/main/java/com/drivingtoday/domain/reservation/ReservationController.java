package com.drivingtoday.domain.reservation;

import com.drivingtoday.domain.reservation.dto.ReservationInstructorResponse;
import com.drivingtoday.domain.reservation.dto.ReservationRequest;
import com.drivingtoday.domain.reservation.dto.ReservationStudentResponse;
import com.drivingtoday.global.auth.config.JwtFilter;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationListService reservationListService;
    private final ReservationDeleteService reservationDeleteService;
    private final ReservationLockFacade reservationLockFacade;

    @Operation(summary = "[학생] 예약만들기 API")
    @PostMapping("/reservation")
    public ResponseEntity<Void> reservationAdd(@RequestBody ReservationRequest reservationRequest) {
        Long studentId = JwtFilter.getAuthentication().getId();
        Long newReservationId = reservationLockFacade.addReservation(reservationRequest, studentId);
        return ResponseEntity.created(URI.create("/reservation/" + newReservationId)).build();
    }

    @Operation(summary = "[학생] 본인 예약리스트 조회 API")
    @GetMapping("/reservations/student")
    public ResponseEntity<List<ReservationStudentResponse>> reservationList(@RequestParam("status") String status) {
        Long studentId = JwtFilter.getAuthentication().getId();
        List<ReservationStudentResponse> allStudentReservation =
                reservationListService.findAllStudentReservation(studentId, status);
        return ResponseEntity.ok(allStudentReservation);
    }


    @Operation(summary = "[강사] 본인 예약리스트 조회 API")
    @GetMapping("/reservations/instructor")
    public ResponseEntity<List<ReservationInstructorResponse>> instructorReservationList(@RequestParam("pageNumber") Integer pageNumber,
                                                                                         @RequestParam("pageSize") Integer pageSize,
                                                                                         @RequestParam("status") String status) {
        Long studentId = JwtFilter.getAuthentication().getId();
        List<ReservationInstructorResponse> allInstructorReservation =
                reservationListService.findAllInstructorReservation(studentId, pageNumber, pageSize, status);
        return ResponseEntity.ok(allInstructorReservation);
    }

    @Operation(summary = "[공통] 예약 취소하기 API")
    @DeleteMapping("/reservations/{reservation_id}")
    public ResponseEntity<Void> cancelStudentReservation(@PathVariable("reservation_id") Long reservationId, @RequestParam("role") String role) {
        if (role.equals("student")) {
            reservationDeleteService.cancelStudentReservation(reservationId, JwtFilter.getAuthentication().getId());
        } else {
            reservationDeleteService.rejectInstructorReservation(reservationId, JwtFilter.getAuthentication().getId());
        }
        return ResponseEntity.ok().build();
    }

}
